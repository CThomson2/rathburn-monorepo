import { Metadata } from "next";
import { AssignmentForm, PendingAssignments } from "./components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAvailableDrums,
  getUpcomingDistillations,
  getPendingAssignments,
} from "./actions";

export const metadata: Metadata = {
  title: "Drum Assignment | Rathburn Online",
  description: "Assign drums to distillation processes",
};

export default async function DrumAssignmentPage() {
  const availableDrums = await getAvailableDrums();
  const upcomingDistillations = await getUpcomingDistillations();
  const { assignments: pendingAssignments, total } =
    await getPendingAssignments();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Drum Assignment</h1>
      <p className="text-gray-600 mb-8">
        Assign drums to distillation processes and manage pending assignments.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Available Drums
            </h3>
            <p className="text-3xl font-bold">{availableDrums.length}</p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="h-6 w-6 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.25 6.375C20.25 8.65317 16.5563 10.5 12 10.5C7.44365 10.5 3.75 8.65317 3.75 6.375M20.25 6.375C20.25 4.09683 16.5563 2.25 12 2.25C7.44365 2.25 3.75 4.09683 3.75 6.375M20.25 6.375V17.625C20.25 19.9032 16.5563 21.75 12 21.75C7.44365 21.75 3.75 19.9032 3.75 17.625V6.375M20.25 12C20.25 14.2782 16.5563 16.125 12 16.125C7.44365 16.125 3.75 14.2782 3.75 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Upcoming Distillations
            </h3>
            <p className="text-3xl font-bold">{upcomingDistillations.length}</p>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="h-6 w-6 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.75 3V5.25M17.25 3V5.25M3 18.75V7.5C3 6.25736 4.00736 5.25 5.25 5.25H18.75C19.9926 5.25 21 6.25736 21 7.5V18.75M3 18.75C3 19.9926 4.00736 21 5.25 21H18.75C19.9926 21 21 19.9926 21 18.75M3 18.75V11.25C3 10.0074 4.00736 9 5.25 9H18.75C19.9926 9 21 10.0074 21 11.25V18.75M12 12.75H12.008V12.758H12V12.75ZM12 15H12.008V15.008H12V15ZM12 17.25H12.008V17.258H12V17.25ZM9.75 15H9.758V15.008H9.75V15ZM9.75 17.25H9.758V17.258H9.75V17.25ZM7.5 15H7.508V15.008H7.5V15ZM7.5 17.25H7.508V17.258H7.5V17.25ZM14.25 12.75H14.258V12.758H14.25V12.75ZM14.25 15H14.258V15.008H14.25V15ZM14.25 17.25H14.258V17.258H14.25V17.25ZM16.5 12.75H16.508V12.758H16.5V12.75ZM16.5 15H16.508V15.008H16.5V15Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Pending Assignments
            </h3>
            <p className="text-3xl font-bold">{total}</p>
          </div>
          <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="h-6 w-6 text-yellow-600"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.25 11.25L11.25 16.25M11.25 8.25H11.26M21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25C17.3848 2.25 21.75 6.61522 21.75 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="assignments">Pending Assignments</TabsTrigger>
          <TabsTrigger value="create">Create Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <PendingAssignments
            initialAssignments={pendingAssignments}
            initialTotal={total}
          />
        </TabsContent>

        <TabsContent value="create">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AssignmentForm
              drums={availableDrums}
              distillations={upcomingDistillations}
            />

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6 h-fit">
                <h3 className="text-lg font-medium mb-4">
                  Assignment Instructions
                </h3>
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center mt-0.5 mr-2">
                      <span className="text-blue-600 font-medium">1</span>
                    </div>
                    <p>
                      Select a drum from the available inventory. Only drums
                      with &quot;in_stock&quot; status are shown.
                    </p>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center mt-0.5 mr-2">
                      <span className="text-blue-600 font-medium">2</span>
                    </div>
                    <p>
                      Choose a distillation process that matches the selected
                      drum&apos;s material type.
                    </p>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center mt-0.5 mr-2">
                      <span className="text-blue-600 font-medium">3</span>
                    </div>
                    <p>
                      Enter your name in the &quot;Assigned By&quot; field to
                      track who made the assignment.
                    </p>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center mt-0.5 mr-2">
                      <span className="text-blue-600 font-medium">4</span>
                    </div>
                    <p>
                      Add any notes or special instructions for this assignment
                      if needed.
                    </p>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center mt-0.5 mr-2">
                      <span className="text-blue-600 font-medium">5</span>
                    </div>
                    <p>
                      Click &quot;Assign Drum&quot; to complete the process. The
                      drum&apos;s status will change to
                      &quot;pending_allocation&quot;.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Only drums with matching material types can be assigned to
                      a distillation. The system will automatically filter
                      distillations based on the selected drum&apos;s material.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
