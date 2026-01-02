import React from "react";

interface Props {
  errors: Record<string, string[]>;
}

const ServerErrors: React.FC<Props> = ({ errors }) => (
  <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg text-red-200">
    <h3 className="font-bold mb-2">Error Updating File Association</h3>
    <ul className="list-disc pl-5 space-y-1">
      {Object.entries(errors).map(([key, errs]) => (
        <li key={key}>
          <strong className="capitalize">{key.replace("_", " ")}:</strong> {errs.join(", ")}
        </li>
      ))}
    </ul>
  </div>
);

export default ServerErrors;
