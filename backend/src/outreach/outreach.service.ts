import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { OutreachEmailAccount } from './entities/email-account.entity';
import { OutreachLeadList } from './entities/lead-list.entity';
import { OutreachLead } from './entities/lead.entity';
import { OutreachCampaign } from './entities/campaign.entity';
import { OutreachCampaignStep } from './entities/campaign-step.entity';
import { OutreachCampaignLead } from './entities/campaign-lead.entity';
import { OutreachCampaignEmail } from './entities/campaign-email.entity';

@Injectable()
export class OutreachService {
  private readonly logger = new Logger(OutreachService.name);
  private autoCheckRunning = false;

  constructor(
    @InjectRepository(OutreachEmailAccount)
    private readonly emailAccountRepo: Repository<OutreachEmailAccount>,
    @InjectRepository(OutreachLeadList)
    private readonly leadListRepo: Repository<OutreachLeadList>,
    @InjectRepository(OutreachLead)
    private readonly leadRepo: Repository<OutreachLead>,
    @InjectRepository(OutreachCampaign)
    private readonly campaignRepo: Repository<OutreachCampaign>,
    @InjectRepository(OutreachCampaignStep)
    private readonly stepRepo: Repository<OutreachCampaignStep>,
    @InjectRepository(OutreachCampaignLead)
    private readonly campaignLeadRepo: Repository<OutreachCampaignLead>,
    @InjectRepository(OutreachCampaignEmail)
    private readonly campaignEmailRepo: Repository<OutreachCampaignEmail>,
  ) {}

  // ===================== EMAIL ACCOUNTS =====================

  async getEmailAccounts(userId: string): Promise<OutreachEmailAccount[]> {
    return this.emailAccountRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createEmailAccount(
    userId: string,
    data: {
      email: string;
      senderName?: string;
      smtpHost: string;
      smtpPort?: number;
      smtpUser: string;
      smtpPass: string;
      imapHost?: string;
      imapPort?: number;
      imapUser?: string;
      imapPass?: string;
      dailyLimit?: number;
      signature?: string;
      smtpRelayUrl?: string;
    },
  ): Promise<OutreachEmailAccount> {
    const account = this.emailAccountRepo.create({
      userId,
      email: data.email,
      senderName: data.senderName || null,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort || 587,
      smtpUser: data.smtpUser,
      smtpPass: data.smtpPass,
      imapHost: data.imapHost || null,
      imapPort: data.imapPort || null,
      imapUser: data.imapUser || null,
      imapPass: data.imapPass || null,
      dailyLimit: data.dailyLimit || 50,
      signature: data.signature || null,
      smtpRelayUrl: data.smtpRelayUrl || null,
    });
    return this.emailAccountRepo.save(account);
  }

  async updateEmailAccount(
    id: string,
    userId: string,
    data: Partial<{
      email: string;
      senderName: string;
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPass: string;
      imapHost: string;
      imapPort: number;
      imapUser: string;
      imapPass: string;
      dailyLimit: number;
      isWarmupEnabled: boolean;
      status: 'active' | 'paused' | 'error';
      signature: string;
      smtpRelayUrl: string;
    }>,
  ): Promise<OutreachEmailAccount> {
    await this.emailAccountRepo.update({ id, userId }, data);
    const account = await this.emailAccountRepo.findOne({ where: { id, userId } });
    if (!account) throw new NotFoundException('Аккаунт не найден');
    return account;
  }

  async deleteEmailAccount(id: string, userId: string): Promise<void> {
    await this.emailAccountRepo.delete({ id, userId });
  }

  async testEmailAccount(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const account = await this.emailAccountRepo.findOne({ where: { id, userId } });
    if (!account) throw new NotFoundException('Аккаунт не найден');

    try {
      if (account.smtpRelayUrl) {
        // Test via relay: send a test ping
        const response = await fetch(account.smtpRelayUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Relay-Secret': process.env.SMTP_RELAY_SECRET || '',
          },
          body: JSON.stringify({
            smtpHost: account.smtpHost,
            smtpPort: account.smtpPort,
            smtpUser: account.smtpUser,
            smtpPass: account.smtpPass,
            smtpSecure: account.smtpPort === 465,
            emailFrom: account.email,
            to: account.email,
            subject: 'Coldy Test — проверка подключения',
            body: 'Тестовое письмо. Подключение работает.',
          }),
          signal: AbortSignal.timeout(30000),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || `Relay returned ${response.status}`);
        }
      } else {
        const transporter = nodemailer.createTransport({
          host: account.smtpHost,
          port: account.smtpPort,
          secure: account.smtpPort === 465,
          auth: { user: account.smtpUser, pass: account.smtpPass },
          connectionTimeout: 10000,
          tls: { rejectUnauthorized: false, servername: account.smtpHost },
        });
        await transporter.verify();
      }
      await this.emailAccountRepo.update(id, { status: 'active', lastError: null });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Неизвестная ошибка';
      await this.emailAccountRepo.update(id, { status: 'error', lastError: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  // ===================== LEAD LISTS =====================

  async getLeadLists(userId: string): Promise<OutreachLeadList[]> {
    return this.leadListRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createLeadList(userId: string, name: string, description?: string): Promise<OutreachLeadList> {
    const list = this.leadListRepo.create({ userId, name, description: description || null });
    return this.leadListRepo.save(list);
  }

  async deleteLeadList(id: string, userId: string): Promise<void> {
    await this.leadRepo.delete({ leadListId: id, userId });
    await this.leadListRepo.delete({ id, userId });
  }

  // ===================== LEADS =====================

  async getLeads(
    userId: string,
    leadListId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: OutreachLead[]; total: number }> {
    const [data, total] = await this.leadRepo.findAndCount({
      where: { userId, leadListId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createLead(
    userId: string,
    leadListId: string,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      company?: string;
      website?: string;
      position?: string;
      phone?: string;
    },
  ): Promise<OutreachLead> {
    const lead = this.leadRepo.create({
      userId,
      leadListId,
      email: data.email,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      company: data.company || null,
      website: data.website || null,
      position: data.position || null,
      phone: data.phone || null,
    });
    const saved = await this.leadRepo.save(lead);
    await this.leadListRepo.increment({ id: leadListId }, 'leadsCount', 1);
    return saved;
  }

  async importLeads(
    userId: string,
    leadListId: string,
    leads: Array<{
      email: string;
      firstName?: string;
      lastName?: string;
      company?: string;
      website?: string;
      position?: string;
      phone?: string;
    }>,
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const row of leads) {
      if (!row.email || !row.email.includes('@')) {
        skipped++;
        continue;
      }
      const exists = await this.leadRepo.findOne({
        where: { userId, leadListId, email: row.email },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await this.leadRepo.save(
        this.leadRepo.create({
          userId,
          leadListId,
          email: row.email,
          firstName: row.firstName || null,
          lastName: row.lastName || null,
          company: row.company || null,
          website: row.website || null,
          position: row.position || null,
          phone: row.phone || null,
        }),
      );
      imported++;
    }

    await this.leadListRepo.update({ id: leadListId }, { leadsCount: () => `(SELECT COUNT(*) FROM outreach_leads WHERE lead_list_id = '${leadListId}')` });

    return { imported, skipped };
  }

  async deleteLead(id: string, userId: string): Promise<void> {
    const lead = await this.leadRepo.findOne({ where: { id, userId } });
    if (!lead) return;
    await this.leadRepo.delete({ id });
    await this.leadListRepo.decrement({ id: lead.leadListId }, 'leadsCount', 1);
  }

  // ===================== CAMPAIGNS =====================

  async getCampaigns(userId: string): Promise<OutreachCampaign[]> {
    return this.campaignRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['steps'],
    });
  }

  async getCampaign(id: string, userId: string): Promise<OutreachCampaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { id, userId },
      relations: ['steps', 'campaignLeads', 'campaignLeads.lead'],
    });
    if (!campaign) throw new NotFoundException('Кампания не найдена');
    campaign.steps = (campaign.steps || []).sort((a, b) => a.stepNumber - b.stepNumber);
    return campaign;
  }

  async createCampaign(
    userId: string,
    data: {
      name: string;
      leadListId?: string;
      emailAccountIds?: string[];
      dailySendLimit?: number;
      sendFromHour?: number;
      sendToHour?: number;
      timezone?: string;
      trackOpens?: boolean;
    },
  ): Promise<OutreachCampaign> {
    const campaign = this.campaignRepo.create({
      userId,
      name: data.name,
      leadListId: data.leadListId || null,
      emailAccountIds: data.emailAccountIds || [],
      dailySendLimit: data.dailySendLimit || 50,
      sendFromHour: data.sendFromHour ?? 9,
      sendToHour: data.sendToHour ?? 18,
      timezone: data.timezone || 'Europe/Moscow',
      trackOpens: data.trackOpens ?? false,
    });
    return this.campaignRepo.save(campaign);
  }

  async updateCampaign(
    id: string,
    userId: string,
    data: Partial<{
      name: string;
      leadListId: string;
      emailAccountIds: string[];
      dailySendLimit: number;
      sendFromHour: number;
      sendToHour: number;
      timezone: string;
      trackOpens: boolean;
      status: 'draft' | 'active' | 'paused' | 'completed';
    }>,
  ): Promise<OutreachCampaign> {
    await this.campaignRepo.update({ id, userId }, data);
    return this.getCampaign(id, userId);
  }

  async deleteCampaign(id: string, userId: string): Promise<void> {
    await this.campaignEmailRepo.delete({ campaignId: id });
    await this.campaignLeadRepo.delete({ campaignId: id });
    await this.stepRepo.delete({ campaignId: id });
    await this.campaignRepo.delete({ id, userId });
  }

  // ===================== CAMPAIGN STEPS =====================

  async saveSteps(
    campaignId: string,
    userId: string,
    steps: Array<{ subject?: string; body: string; delayDays?: number; delayHours?: number }>,
  ): Promise<OutreachCampaignStep[]> {
    // Verify ownership
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId, userId } });
    if (!campaign) throw new NotFoundException('Кампания не найдена');

    // Delete old steps
    await this.stepRepo.delete({ campaignId });

    // Create new steps
    const entities = steps.map((s, i) =>
      this.stepRepo.create({
        campaignId,
        stepNumber: i + 1,
        subject: s.subject || null,
        body: s.body,
        delayDays: s.delayDays ?? (i === 0 ? 0 : 2),
        delayHours: s.delayHours ?? 0,
      }),
    );
    return this.stepRepo.save(entities);
  }

  // ===================== CAMPAIGN LAUNCH =====================

  async launchCampaign(id: string, userId: string): Promise<OutreachCampaign> {
    const campaign = await this.getCampaign(id, userId);
    if (!campaign.leadListId) throw new BadRequestException('Выберите список лидов');
    if (campaign.emailAccountIds.length === 0) throw new BadRequestException('Выберите почтовые аккаунты');
    if (!campaign.steps || campaign.steps.length === 0) throw new BadRequestException('Добавьте шаги цепочки');

    // Load leads from the lead list
    const leads = await this.leadRepo.find({
      where: { leadListId: campaign.leadListId, userId, status: 'active' },
    });
    if (leads.length === 0) throw new BadRequestException('Список лидов пуст');

    // Create campaign leads
    const now = new Date();
    const campaignLeads = leads.map((lead) =>
      this.campaignLeadRepo.create({
        campaignId: id,
        leadId: lead.id,
        currentStep: 0,
        status: 'pending',
        nextSendAt: now,
      }),
    );
    await this.campaignLeadRepo.save(campaignLeads);

    // Activate campaign
    await this.campaignRepo.update({ id }, { status: 'active' });
    campaign.status = 'active';

    return campaign;
  }

  async pauseCampaign(id: string, userId: string): Promise<void> {
    await this.campaignRepo.update({ id, userId }, { status: 'paused' });
  }

  async resumeCampaign(id: string, userId: string): Promise<void> {
    await this.campaignRepo.update({ id, userId }, { status: 'active' });
  }

  // ===================== SEND EMAILS (called by scheduler/manually) =====================

  async processCampaignEmails(campaignId: string, userId: string): Promise<{ sent: number; errors: number }> {
    const campaign = await this.getCampaign(campaignId, userId);
    if (campaign.status !== 'active') return { sent: 0, errors: 0 };

    const accounts = await this.emailAccountRepo.find({
      where: { id: In(campaign.emailAccountIds), userId, status: 'active' },
    });
    if (accounts.length === 0) return { sent: 0, errors: 0 };

    // Get pending campaign leads that need to be sent now
    const pendingLeads = await this.campaignLeadRepo.find({
      where: {
        campaignId,
        status: In(['pending', 'in_progress']),
        nextSendAt: LessThanOrEqual(new Date()),
      },
      relations: ['lead'],
      take: campaign.dailySendLimit,
    });

    let sent = 0;
    let errors = 0;
    let accountIndex = 0;

    for (const cl of pendingLeads) {
      const step = campaign.steps.find((s) => s.stepNumber === cl.currentStep + 1);
      if (!step) {
        await this.campaignLeadRepo.update(cl.id, { status: 'completed' });
        continue;
      }

      const account = accounts[accountIndex % accounts.length];
      accountIndex++;

      // Personalize email
      const subject = this.personalizeText(step.subject || '', cl.lead);
      const body = this.personalizeText(step.body, cl.lead);

      try {
        const messageId = await this.sendSingleEmail(account, cl.lead.email, subject, body);

        // Save email record
        await this.campaignEmailRepo.save(
          this.campaignEmailRepo.create({
            campaignId,
            campaignStepId: step.id,
            campaignLeadId: cl.id,
            leadId: cl.lead.id,
            emailAccountId: account.id,
            toEmail: cl.lead.email,
            subject,
            body,
            status: 'sent',
            sentAt: new Date(),
            messageId,
          }),
        );

        // Update campaign lead
        const nextStep = campaign.steps.find((s) => s.stepNumber === step.stepNumber + 1);
        if (nextStep) {
          const nextSendAt = new Date();
          nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays);
          nextSendAt.setHours(nextSendAt.getHours() + nextStep.delayHours);
          await this.campaignLeadRepo.update(cl.id, {
            currentStep: step.stepNumber,
            status: 'in_progress',
            nextSendAt,
          });
        } else {
          await this.campaignLeadRepo.update(cl.id, {
            currentStep: step.stepNumber,
            status: 'completed',
          });
        }

        sent++;
        await this.campaignRepo.increment({ id: campaignId }, 'statsSent', 1);

        // Update account daily sent counter
        const today = new Date().toISOString().slice(0, 10);
        if (account.sentTodayDate !== today) {
          account.sentToday = 1;
          account.sentTodayDate = today;
        } else {
          account.sentToday = (account.sentToday || 0) + 1;
        }
        await this.emailAccountRepo.save(account);

        // Random delay between sends (2-8 seconds to simulate human)
        await new Promise((r) => setTimeout(r, 2000 + Math.random() * 6000));
      } catch (err: any) {
        this.logger.error(`Send failed to ${cl.lead.email}: ${err.message}`);
        errors++;

        await this.campaignEmailRepo.save(
          this.campaignEmailRepo.create({
            campaignId,
            campaignStepId: step.id,
            campaignLeadId: cl.id,
            leadId: cl.lead.id,
            emailAccountId: account.id,
            toEmail: cl.lead.email,
            subject,
            body,
            status: 'failed',
            errorMessage: err.message,
          }),
        );
      }
    }

    // Check if campaign is completed
    const remaining = await this.campaignLeadRepo.count({
      where: { campaignId, status: In(['pending', 'in_progress']) },
    });
    if (remaining === 0) {
      await this.campaignRepo.update({ id: campaignId }, { status: 'completed' });
    }

    return { sent, errors };
  }

  private personalizeText(text: string, lead: OutreachLead): string {
    return text
      .replace(/\{\{firstName\}\}/g, lead.firstName || '')
      .replace(/\{\{lastName\}\}/g, lead.lastName || '')
      .replace(/\{\{company\}\}/g, lead.company || '')
      .replace(/\{\{email\}\}/g, lead.email)
      .replace(/\{\{position\}\}/g, lead.position || '')
      .replace(/\{\{website\}\}/g, lead.website || '')
      .replace(/\{\{phone\}\}/g, lead.phone || '');
  }

  private async sendSingleEmail(
    account: OutreachEmailAccount,
    to: string,
    subject: string,
    body: string,
  ): Promise<string | null> {
    const fullBody = body + (account.signature ? `\n\n${account.signature}` : '');
    const emailFrom = account.senderName
      ? `"${account.senderName}" <${account.email}>`
      : account.email;

    if (account.smtpRelayUrl) {
      // Send via relay
      const response = await fetch(account.smtpRelayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Relay-Secret': process.env.SMTP_RELAY_SECRET || '',
        },
        body: JSON.stringify({
          smtpHost: account.smtpHost,
          smtpPort: account.smtpPort,
          smtpUser: account.smtpUser,
          smtpPass: account.smtpPass,
          smtpSecure: account.smtpPort === 465,
          emailFrom: account.email,
          fromName: account.senderName || undefined,
          to,
          subject,
          body: fullBody,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || `Relay returned ${response.status}`);
      }
      return result.messageId || null;
    } else {
      // Direct SMTP
      const transporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpPort === 465,
        auth: { user: account.smtpUser, pass: account.smtpPass },
        connectionTimeout: 15000,
        tls: { rejectUnauthorized: false, servername: account.smtpHost },
      });

      const info = await transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        text: fullBody,
      });
      return info.messageId || null;
    }
  }

  // ===================== CAMPAIGN EMAILS / INBOX =====================

  async getCampaignEmails(
    campaignId: string,
    userId: string,
    page = 1,
    limit = 50,
    status?: string,
  ): Promise<{ data: OutreachCampaignEmail[]; total: number }> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId, userId } });
    if (!campaign) throw new NotFoundException('Кампания не найдена');

    const where: any = { campaignId };
    if (status) where.status = status;

    const [data, total] = await this.campaignEmailRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getInbox(userId: string, page = 1, limit = 50): Promise<{ data: OutreachCampaignEmail[]; total: number }> {
    const campaigns = await this.campaignRepo.find({ where: { userId }, select: ['id'] });
    if (campaigns.length === 0) return { data: [], total: 0 };

    const campaignIds = campaigns.map((c) => c.id);
    const [data, total] = await this.campaignEmailRepo.findAndCount({
      where: { campaignId: In(campaignIds), status: 'replied' },
      order: { repliedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  // ===================== CHECK REPLIES VIA IMAP =====================

  async checkReplies(userId: string): Promise<{ checked: number; newReplies: number; newBounces: number; errors: string[] }> {
    // Get accounts with IMAP configured
    const accounts = await this.emailAccountRepo.find({ where: { userId } });
    const imapAccounts = accounts.filter((a) => a.imapHost && a.imapUser && a.imapPass);

    if (imapAccounts.length === 0) {
      return { checked: 0, newReplies: 0, newBounces: 0, errors: ['Нет аккаунтов с настроенным IMAP'] };
    }

    const { ImapFlow } = await this.loadImapFlow();
    const simpleParser = await this.loadSimpleParser();

    let totalChecked = 0;
    let totalNewReplies = 0;
    let totalNewBounces = 0;
    const errors: string[] = [];

    for (const account of imapAccounts) {
      try {
        const { checked, newReplies, newBounces } = await this.checkAccountReplies(
          account,
          userId,
          ImapFlow,
          simpleParser,
        );
        totalChecked += checked;
        totalNewReplies += newReplies;
        totalNewBounces += newBounces;
      } catch (err: any) {
        this.logger.error(`IMAP check failed for ${account.email}: ${err.message}`);
        errors.push(`${account.email}: ${err.message}`);
      }
    }

    return { checked: totalChecked, newReplies: totalNewReplies, newBounces: totalNewBounces, errors };
  }

  /**
   * Periodically scan IMAP inboxes of every user with a configured account, so
   * replies and bounces are picked up even when nobody opens the inbox page.
   * Runs in-process — works on Railway because the API service stays alive.
   * Disable with OUTREACH_AUTO_CHECK=false; change cadence with OUTREACH_CHECK_CRON
   * (a cron expression, default every 10 minutes).
   */
  @Cron(process.env.OUTREACH_CHECK_CRON || CronExpression.EVERY_10_MINUTES, {
    name: 'outreach-check-replies',
  })
  async scheduledCheckReplies(): Promise<void> {
    if (process.env.OUTREACH_AUTO_CHECK === 'false') return;
    if (this.autoCheckRunning) return; // skip if a previous run is still going
    this.autoCheckRunning = true;
    try {
      const accounts = await this.emailAccountRepo.find();
      const userIds = [
        ...new Set(
          accounts
            .filter((a) => a.imapHost && a.imapUser && a.imapPass)
            .map((a) => a.userId),
        ),
      ];

      for (const userId of userIds) {
        try {
          const { newReplies, newBounces } = await this.checkReplies(userId);
          if (newReplies || newBounces) {
            this.logger.log(
              `Auto IMAP check (${userId}): ${newReplies} replies, ${newBounces} bounces`,
            );
          }
        } catch (err: any) {
          this.logger.warn(`Auto IMAP check failed for ${userId}: ${err.message}`);
        }
      }
    } finally {
      this.autoCheckRunning = false;
    }
  }

  private async checkAccountReplies(
    account: OutreachEmailAccount,
    userId: string,
    ImapFlow: any,
    simpleParser: (source: any) => Promise<any>,
  ): Promise<{ checked: number; newReplies: number; newBounces: number }> {
    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort || 993,
      secure: true,
      auth: { user: account.imapUser, pass: account.imapPass },
      logger: false,
      tls: { rejectUnauthorized: false },
    });

    let checked = 0;
    let newReplies = 0;
    let newBounces = 0;

    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');

      try {
        const totalMessages = client.mailbox?.exists || 0;
        if (totalMessages === 0) return { checked: 0, newReplies: 0, newBounces: 0 };

        const startSeq = Math.max(1, totalMessages - 49);

        for await (const msg of client.fetch(`${startSeq}:*`, {
          envelope: true,
          source: true,
        })) {
          checked++;
          const envelope = msg.envelope;
          if (!envelope) continue;

          const inReplyTo = envelope.inReplyTo || null;
          const fromAddr = envelope.from?.[0]?.address?.toLowerCase() || '';

          // Bounce check first: some DSNs carry the original Message-ID in
          // In-Reply-To and would otherwise be miscounted as a reply.
          const bounce = await this.handleBounce(msg, account, simpleParser);
          if (bounce.isBounce) {
            newBounces += bounce.counted;
            continue;
          }

          if (!fromAddr) continue;

          // Strategy 1: Match by In-Reply-To header against stored messageId
          if (inReplyTo) {
            const matched = await this.campaignEmailRepo.findOne({
              where: { messageId: inReplyTo, status: 'sent' },
            });
            if (matched) {
              const replyText = await this.extractReplyText(msg.source, simpleParser);
              await this.markAsReplied(matched, replyText);
              newReplies++;
              continue;
            }
          }

          // Strategy 2: Match by sender email against toEmail of sent campaign emails
          const matchedBySender = await this.campaignEmailRepo.findOne({
            where: { toEmail: fromAddr, emailAccountId: account.id, status: 'sent' },
            order: { sentAt: 'DESC' },
          });
          if (matchedBySender) {
            const replyText = await this.extractReplyText(msg.source, simpleParser);
            await this.markAsReplied(matchedBySender, replyText);
            newReplies++;
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
    } catch (err: any) {
      try { await client.logout(); } catch {}
      throw err;
    }

    return { checked, newReplies, newBounces };
  }

  private async markAsReplied(campaignEmail: OutreachCampaignEmail, replyText: string): Promise<void> {
    await this.campaignEmailRepo.update(campaignEmail.id, {
      status: 'replied',
      repliedAt: new Date(),
      replyText,
    });

    // Update campaign lead status
    await this.campaignLeadRepo.update(campaignEmail.campaignLeadId, {
      status: 'replied',
    });

    // Increment campaign statsReplied
    await this.campaignRepo.increment({ id: campaignEmail.campaignId }, 'statsReplied', 1);
  }

  // ===================== BOUNCE DETECTION =====================

  /**
   * Detect bounce / delivery-failure notifications and mark the matching sent
   * campaign email as bounced. Returns { isBounce } so the caller skips reply
   * strategies for this message, and { counted } for stats aggregation.
   */
  private async handleBounce(
    msg: any,
    account: OutreachEmailAccount,
    simpleParser: (source: any) => Promise<any>,
  ): Promise<{ isBounce: boolean; counted: number }> {
    if (!this.isBounceMessage(msg.envelope)) {
      return { isBounce: false, counted: 0 };
    }

    // Pull together everything we can read from the bounce to locate the
    // original recipient / Message-ID it refers to.
    let parsedText = '';
    try {
      const parsed = msg.source ? await simpleParser(msg.source) : null;
      parsedText = `${parsed?.text || ''}\n${parsed?.html || ''}`;
    } catch {
      // ignore parse errors — fall back to raw source below
    }
    const rawText = `${parsedText}\n${msg.source ? msg.source.toString('utf8') : ''}`;

    // 1) Match by the original Message-ID embedded in the DSN body.
    const byId = await this.matchBounceByMessageId(rawText, account);
    if (byId) {
      await this.markAsBounced(byId, this.bounceReason(msg.envelope, rawText));
      return { isBounce: true, counted: 1 };
    }

    // 2) Match by recipient address (Final-Recipient first, then any address).
    const ownAddrs = [account.email?.toLowerCase(), account.smtpUser?.toLowerCase()];
    for (const rcpt of this.extractBounceRecipients(rawText)) {
      if (ownAddrs.includes(rcpt)) continue; // never the bounce target
      const matched = await this.campaignEmailRepo.findOne({
        where: { toEmail: rcpt, emailAccountId: account.id, status: 'sent' },
        order: { sentAt: 'DESC' },
      });
      if (matched) {
        await this.markAsBounced(matched, this.bounceReason(msg.envelope, rawText));
        return { isBounce: true, counted: 1 };
      }
    }

    // Recognised as a bounce but not mappable to a tracked send — still treat
    // as handled so it is never misclassified as a reply.
    return { isBounce: true, counted: 0 };
  }

  private isBounceMessage(envelope: any): boolean {
    const fromAddr = envelope?.from?.[0]?.address?.toLowerCase() || '';
    const subject = (envelope?.subject || '').toLowerCase();
    const fromIsDaemon =
      !fromAddr ||
      fromAddr.includes('mailer-daemon') ||
      fromAddr.includes('postmaster') ||
      fromAddr.startsWith('bounce') ||
      fromAddr.includes('mail-daemon');
    const subjectLooksBounce =
      /undeliver|delivery (status|has failed|failed|failure)|failure notice|returned mail|mail delivery (failed|system)|delivery incomplete|не доставлен|недоставл|возврат|сбой доставки/i.test(
        subject,
      );
    return fromIsDaemon || subjectLooksBounce;
  }

  private async matchBounceByMessageId(
    text: string,
    account: OutreachEmailAccount,
  ): Promise<OutreachCampaignEmail | null> {
    const ids = text.match(/<[^<>@\s]+@[^<>@\s]+>/g) || [];
    for (const id of [...new Set(ids)]) {
      const matched = await this.campaignEmailRepo.findOne({
        where: { messageId: id, emailAccountId: account.id, status: 'sent' },
      });
      if (matched) return matched;
    }
    return null;
  }

  private extractBounceRecipients(text: string): string[] {
    const emails: string[] = [];
    const push = (e?: string) => {
      const v = e?.toLowerCase();
      if (v && !emails.includes(v)) emails.push(v);
    };
    // Final-Recipient / Original-Recipient are the authoritative DSN fields.
    const fieldRe = /(?:final|original)-recipient:\s*(?:rfc822;)?\s*<?([^\s<>;]+@[^\s<>;]+)>?/gi;
    let m: RegExpExecArray | null;
    while ((m = fieldRe.exec(text))) push(m[1]);
    // Fallback: any address-looking token (matched only against our sent rows).
    const anyRe = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
    while ((m = anyRe.exec(text))) push(m[0]);
    return emails;
  }

  private bounceReason(envelope: any, text: string): string {
    const subject = envelope?.subject || 'Возврат письма';
    const status = /status:\s*(\d\.\d\.\d)/i.exec(text)?.[1];
    const diag = /diagnostic-code:\s*(.+)/i.exec(text)?.[1]?.trim();
    const parts = [subject];
    if (status) parts.push(`status ${status}`);
    if (diag) parts.push(diag.slice(0, 300));
    return parts.join(' — ').slice(0, 1000);
  }

  private async markAsBounced(campaignEmail: OutreachCampaignEmail, reason: string): Promise<void> {
    await this.campaignEmailRepo.update(campaignEmail.id, {
      status: 'bounced',
      errorMessage: reason || 'Возврат письма',
    });

    // Update campaign lead status
    await this.campaignLeadRepo.update(campaignEmail.campaignLeadId, {
      status: 'bounced',
    });

    // Increment campaign statsBounced
    await this.campaignRepo.increment({ id: campaignEmail.campaignId }, 'statsBounced', 1);
  }

  private async extractReplyText(
    source: Buffer | undefined,
    simpleParser: (source: any) => Promise<any>,
  ): Promise<string> {
    if (!source) return '';
    try {
      const parsed = await simpleParser(source);
      return parsed.text || '';
    } catch {
      return '';
    }
  }

  private async loadImapFlow(): Promise<any> {
    try {
      return await import('imapflow');
    } catch {
      throw new Error('IMAP модуль не установлен (npm install imapflow)');
    }
  }

  private async loadSimpleParser(): Promise<(source: any) => Promise<any>> {
    try {
      const { simpleParser } = await import('mailparser');
      return simpleParser;
    } catch {
      throw new Error('mailparser модуль не установлен (npm install mailparser)');
    }
  }

  // ===================== DASHBOARD STATS =====================

  async getDashboardStats(userId: string): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    totalLeads: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    totalBounced: number;
  }> {
    const accounts = await this.emailAccountRepo.find({ where: { userId } });
    const leadLists = await this.leadListRepo.find({ where: { userId } });
    const campaigns = await this.campaignRepo.find({ where: { userId } });

    const totalLeads = leadLists.reduce((sum, l) => sum + l.leadsCount, 0);

    return {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter((a) => a.status === 'active').length,
      totalLeads,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalSent: campaigns.reduce((sum, c) => sum + c.statsSent, 0),
      totalOpened: campaigns.reduce((sum, c) => sum + c.statsOpened, 0),
      totalReplied: campaigns.reduce((sum, c) => sum + c.statsReplied, 0),
      totalBounced: campaigns.reduce((sum, c) => sum + c.statsBounced, 0),
    };
  }
}
