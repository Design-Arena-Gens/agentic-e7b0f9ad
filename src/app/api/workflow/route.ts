import { NextResponse } from 'next/server';
import { buildWorkflow, workflowInputSchema } from '@/lib/workflow';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const input = workflowInputSchema.parse(payload);
    const workflow = await buildWorkflow(input);

    return NextResponse.json(workflow);
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 });
    }

    return new NextResponse('Unexpected error generating workflow', {
      status: 500,
    });
  }
}
