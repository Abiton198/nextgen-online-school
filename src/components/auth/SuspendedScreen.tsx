import React from "react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebaseConfig";

const SuspendedScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Account Suspended
      </h1>
      <p className="text-gray-700 mb-6 max-w-md text-center">
        Your account has been suspended by the school administration.  
        Please contact your principal or school administrator for more details.
      </p>
      <Button
        className="bg-blue-600 hover:bg-blue-700"
        onClick={() => auth.signOut()}
      >
        Logout
      </Button>
    </div>
  );
};

export default SuspendedScreen;
