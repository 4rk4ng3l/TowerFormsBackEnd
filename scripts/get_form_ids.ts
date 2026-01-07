import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const form = await prisma.form.findFirst({
    where: { name: 'Mantenimiento Preventivo Torre' },
    include: {
      steps: {
        include: {
          questions: {
            orderBy: { orderNumber: 'asc' }
          }
        },
        orderBy: { stepNumber: 'asc' }
      }
    }
  });

  if (!form) {
    console.log('Form not found');
    return;
  }

  console.log(JSON.stringify({
    formId: form.id,
    userId: 'b3fc44e3-3b20-4171-80d2-f416d1780867',
    steps: form.steps.map(step => ({
      id: step.id,
      title: step.title,
      questions: step.questions.map(q => ({
        id: q.id,
        text: q.questionText,
        type: q.type
      }))
    }))
  }, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
