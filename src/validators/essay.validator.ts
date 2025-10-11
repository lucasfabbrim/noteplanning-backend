import { z } from 'zod';

export const createEssaySchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  essayTitle: z.string().min(1, 'Essay title is required').max(255, 'Essay title too long'),
  essayFileUrl: z.string().url('Invalid file URL'),
  essayText: z.string().min(1, 'Essay text is required'),
  wordCount: z.number().int().min(1, 'Word count must be at least 1'),
  connectorCount: z.number().int().min(0, 'Connector count cannot be negative'),
  grammarErrors: z.number().int().min(0, 'Grammar errors cannot be negative'),
  cohesionScore: z.number().int().min(0).max(200, 'Cohesion score must be between 0-200'),
  coherenceScore: z.number().int().min(0).max(200, 'Coherence score must be between 0-200'),
  argumentationScore: z.number().int().min(0).max(200, 'Argumentation score must be between 0-200'),
  punctuationIssues: z.number().int().min(0, 'Punctuation issues cannot be negative'),
  standardDeviations: z.number().int().min(0, 'Standard deviations cannot be negative'),
  deviationsByCompetence: z.object({
    competence1: z.number(),
    competence2: z.number(),
    competence3: z.number(),
    competence4: z.number(),
    competence5: z.number(),
  }),
  scoreByCompetence: z.object({
    competence1: z.number(),
    competence2: z.number(),
    competence3: z.number(),
    competence4: z.number(),
    competence5: z.number(),
  }),
  totalScore: z.number().int().min(0).max(1000, 'Total score must be between 0-1000'),
  aiVersion: z.string().min(1, 'AI version is required'),
  feedbackComments: z.array(z.string()).default([]),
  commentedReview: z.string().default(''),
});

export const updateEssayStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'ERROR']),
});

export const updateEssayScoresSchema = z.object({
  cohesionScore: z.number().int().min(0).max(200).optional(),
  coherenceScore: z.number().int().min(0).max(200).optional(),
  argumentationScore: z.number().int().min(0).max(200).optional(),
  totalScore: z.number().int().min(0).max(1000).optional(),
  deviationsByCompetence: z.object({
    competence1: z.number(),
    competence2: z.number(),
    competence3: z.number(),
    competence4: z.number(),
    competence5: z.number(),
  }).optional(),
  scoreByCompetence: z.object({
    competence1: z.number(),
    competence2: z.number(),
    competence3: z.number(),
    competence4: z.number(),
    competence5: z.number(),
  }).optional(),
});

export const updateEssayAnalysisSchema = z.object({
  wordCount: z.number().int().min(1).optional(),
  connectorCount: z.number().int().min(0).optional(),
  grammarErrors: z.number().int().min(0).optional(),
  punctuationIssues: z.number().int().min(0).optional(),
  standardDeviations: z.number().int().min(0).optional(),
  feedbackComments: z.array(z.string()).optional(),
  commentedReview: z.string().optional(),
  aiVersion: z.string().min(1).optional(),
});

export const essayParamsSchema = z.object({
  id: z.string().min(1, 'Essay ID is required'),
});

export const essayCustomerParamsSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const statusParamsSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'ERROR']),
});

export const paginationQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default(10),
});

export type CreateEssayInput = z.infer<typeof createEssaySchema>;
export type UpdateEssayStatusInput = z.infer<typeof updateEssayStatusSchema>;
export type UpdateEssayScoresInput = z.infer<typeof updateEssayScoresSchema>;
export type UpdateEssayAnalysisInput = z.infer<typeof updateEssayAnalysisSchema>;
export type EssayParams = z.infer<typeof essayParamsSchema>;
export type EssayCustomerParams = z.infer<typeof essayCustomerParamsSchema>;
export type StatusParams = z.infer<typeof statusParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
