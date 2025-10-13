import { PrismaClient, Essay, EssayStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class EssayRepository extends BaseRepository<Essay> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByCustomerId(customerId: string, page: number = 1, limit: number = 10): Promise<Essay[]> {
    return this.prisma.essay.findMany({
      where: {
        customerId,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findByStatus(status: EssayStatus, page: number = 1, limit: number = 10): Promise<Essay[]> {
    return this.prisma.essay.findMany({
      where: {
        status,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findByCustomerIdAndStatus(
    customerId: string, 
    status: EssayStatus, 
    page: number = 1, 
    limit: number = 10
  ): Promise<Essay[]> {
    return this.prisma.essay.findMany({
      where: {
        customerId,
        status,
        deactivatedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async updateStatus(id: string, status: EssayStatus): Promise<Essay> {
    return this.prisma.essay.update({
      where: { id },
      data: { status },
    });
  }

  async updateScores(
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
    return this.prisma.essay.update({
      where: { id },
      data: scores,
    });
  }

  async updateAnalysis(
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
    return this.prisma.essay.update({
      where: { id },
      data: analysis,
    });
  }

  async getCustomerEssayCount(customerId: string): Promise<number> {
    return this.prisma.essay.count({
      where: {
        customerId,
        deactivatedAt: null,
      },
    });
  }

  async getPendingEssaysCount(): Promise<number> {
    return this.prisma.essay.count({
      where: {
        status: 'PENDING',
        deactivatedAt: null,
      },
    });
  }

  async create(data: any): Promise<Essay> {
    return this.prisma.essay.create({ data });
  }

  async findById(id: string): Promise<Essay | null> {
    return this.prisma.essay.findUnique({
      where: { id, deactivatedAt: null },
    });
  }

  async count(): Promise<number> {
    return this.prisma.essay.count({
      where: { deactivatedAt: null },
    });
  }

  async softDelete(id: string): Promise<Essay> {
    return this.prisma.essay.update({
      where: { id },
      data: { deactivatedAt: new Date() },
    });
  }
}
