import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const submissions = await prisma.submission.findMany({
    include: {
      answers: true,
      files: true
    }
  });

  console.log(JSON.stringify({
    count: submissions.length,
    submissions: submissions.map(s => ({
      id: s.id,
      formId: s.formId,
      userId: s.userId,
      metadata: s.metadata,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      synced: s.syncStatus,
      answersCount: s.answers.length,
      filesCount: s.files.length
    }))
  }, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
