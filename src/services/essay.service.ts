import { PrismaClient, Essay, EssayStatus } from '@prisma/client';
import { BaseService } from './base.service';
import { EssayRepository } from '@/repositories/essay.repository';

export class EssayService extends BaseService {
  private essayRepository: EssayRepository;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.essayRepository = new EssayRepository(prisma);
  }

  async createEssay(data: {
    customerId: string;
    essayTitle: string;
    essayFileUrl: string;
    essayText: string;
    wordCount: number;
    connectorCount: number;
    grammarErrors: number;
    cohesionScore: number;
    coherenceScore: number;
    argumentationScore: number;
    punctuationIssues: number;
    standardDeviations: number;
    deviationsByCompetence: any;
    scoreByCompetence: any;
    totalScore: number;
    aiVersion: string;
    feedbackComments: string[];
    commentedReview: string;
  }): Promise<Essay> {
    try {
      return await this.essayRepository.create({
        ...data,
        status: 'PENDING',
      });
    } catch (error) {
      throw new Error(`Failed to create essay: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEssayById(id: string): Promise<Essay | null> {
    try {
      return await this.essayRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to get essay: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEssaysByCustomer(
    customerId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<Essay[]> {
    try {
      return await this.essayRepository.findByCustomerId(customerId, page, limit);
    } catch (error) {
      throw new Error(`Failed to get customer essays: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEssaysByStatus(
    status: EssayStatus, 
    page: number = 1, 
    limit: number = 10
  ): Promise<Essay[]> {
    try {
      return await this.essayRepository.findByStatus(status, page, limit);
    } catch (error) {
      throw new Error(`Failed to get essays by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEssayStatus(id: string, status: EssayStatus): Promise<Essay> {
    try {
      return await this.essayRepository.updateStatus(id, status);
    } catch (error) {
      throw new Error(`Failed to update essay status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEssayScores(
    id: string,
    scores: {
      cohesionScore?: number;
      coherenceScore?: number;
      argumentationScore?: number;
      totalScore?: number;
      deviationsByCompetence?: any;
      scoreByCompetence?: any;
    }
  ): Promise<Essay> {
    try {
      return await this.essayRepository.updateScores(id, scores);
    } catch (error) {
      throw new Error(`Failed to update essay scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEssayAnalysis(
    id: string,
    analysis: {
      wordCount?: number;
      connectorCount?: number;
      grammarErrors?: number;
      punctuationIssues?: number;
      standardDeviations?: number;
      feedbackComments?: string[];
      commentedReview?: string;
      aiVersion?: string;
    }
  ): Promise<Essay> {
    try {
      return await this.essayRepository.updateAnalysis(id, analysis);
    } catch (error) {
      throw new Error(`Failed to update essay analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteEssay(id: string): Promise<boolean> {
    try {
      await this.essayRepository.softDelete(id);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete essay: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomerEssayCount(customerId: string): Promise<number> {
    try {
      return await this.essayRepository.getCustomerEssayCount(customerId);
    } catch (error) {
      throw new Error(`Failed to get customer essay count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPendingEssaysCount(): Promise<number> {
    try {
      return await this.essayRepository.getPendingEssaysCount();
    } catch (error) {
      throw new Error(`Failed to get pending essays count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getEssayStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    error: number;
  }> {
    try {
      const [total, pending, reviewed, error] = await Promise.all([
        this.essayRepository.count(),
        this.essayRepository.getPendingEssaysCount(),
        this.essayRepository.findByStatus('REVIEWED').then(essays => essays.length),
        this.essayRepository.findByStatus('ERROR').then(essays => essays.length),
      ]);

      return { total, pending, reviewed, error };
    } catch (error) {
      throw new Error(`Failed to get essay stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
