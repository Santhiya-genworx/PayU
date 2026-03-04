import { useEffect, useState } from "react";
import type { ExtractedFile } from "../../../types/process";

interface ProgressModalProps {
  files: ExtractedFile[];
  submitFn: (data: any, file: File) => Promise<any>;
  onClose: () => void;
}

interface FileStatus {
  id: string;
  fileName: string;
  status: "pending" | "success" | "error";
}

export default function ProgressModal({
  files,
  onClose,
  submitFn,
}: ProgressModalProps) {
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>(
    files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      status: "pending",
    }))
  );

  const [progress, setProgress] = useState(0);

  useEffect(() => {
  const saveFiles = async () => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.extractedData) continue;

      try {
        await submitFn(file.extractedData, file.file);
        setFileStatuses(prev => prev.map(f => f.id === file.id ? { ...f, status: "success" } : f));
      } catch {
        setFileStatuses(prev => prev.map(f => f.id === file.id ? { ...f, status: "error" } : f));
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
  };

  saveFiles();
}, []);

  return (
    <div className="absolute inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Saving Files</h3>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-gray-500">{progress}% completed</p>

        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {fileStatuses.map((f) => (
            <div key={f.id} className="flex justify-between text-sm">
              <span>{f.fileName}</span>
              <span>
                {f.status === "pending" && "⏳"}
                {f.status === "success" && "✅"}
                {f.status === "error" && "❌"}
              </span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium"       >
          Close
        </button>
      </div>
    </div>
  );
}