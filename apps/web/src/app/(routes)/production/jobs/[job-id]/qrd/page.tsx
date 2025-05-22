import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { QRDForm } from "@/features/production/qrd-form";
import { fetchQRDData } from "@/app/actions/qrd";
import { emptyQRDData } from "@/features/production/types/qrd";
import { fetchProductionJobById } from "@/app/actions/production";
// Assuming Order type from here has tasks with op_id and name/type.
import type { Order as JobDetailsType } from "@/features/production/types";

interface PageProps {
  params: {
    "job-id": string;
  };
}

export default async function QRDPage({ params }: PageProps) {
  const jobIdFromRoute = params["job-id"];

  const jobDetails: JobDetailsType | null =
    await fetchProductionJobById(jobIdFromRoute);

  if (!jobDetails) {
    console.error(`Job details not found for job ID: ${jobIdFromRoute}`);
    notFound();
    return;
  }

  // Attempt to find the distillation operation and its ID.
  // This part is speculative and depends HEAVILY on your actual Task type structure.
  const distillationOp = jobDetails.tasks?.find((task: any) => {
    const taskName = task.name;
    return taskName?.toLowerCase().includes("distillation");
  });

  let operationIdToUse: string | undefined = undefined;

  if (distillationOp && distillationOp.op_id) {
    operationIdToUse = distillationOp.op_id;
  } else if (distillationOp) {
    console.warn(
      `Distillation operation found but op_id is missing. Task:`,
      distillationOp
    );
    operationIdToUse =
      (distillationOp as any).id || (distillationOp as any).operationId;
  }

  if (!operationIdToUse) {
    console.error(
      `Could not determine a valid operation ID for distillation in job ${jobIdFromRoute}. Checked for op_id, operationId, id. Tasks:`,
      jobDetails.tasks
    );
    notFound();
    return;
  }

  const initialQRDData = await fetchQRDData(operationIdToUse);

  console.log("Initial QRD Data:", initialQRDData);

  if (!initialQRDData) {
    console.error(
      `QRD data not found for operation ID: ${operationIdToUse} (Job ID: ${jobIdFromRoute})`
    );
    notFound();
    return;
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Distillation Record (QRD)
      </h1>
      <p className="text-muted-foreground">
        Job: {jobDetails.jobName || jobIdFromRoute.slice(0, 8).toUpperCase()} /
        Distillation Operation ID: {operationIdToUse.slice(0, 8).toUpperCase()}
      </p>
      <QRDForm initialData={initialQRDData} />
    </div>
  );
}
