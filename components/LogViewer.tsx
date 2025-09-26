import React from 'react';
import type { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

const SyntaxHighlight: React.FC<{ json: object }> = ({ json }) => {
    const jsonString = JSON.stringify(json, null, 2);
    const highlighted = jsonString.replace(/"([^"]+)":/g, '<span class="text-pink-500">"$1"</span>:').replace(/: "([^"]*)"/g, ': <span class="text-green-500">"$1"</span>');
    return <pre className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg flex flex-col h-full max-h-[70vh]">
      <div className="p-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-xl">
        <h2 className="text-xl font-semibold text-slate-700">Interaction Logs</h2>
        <p className="text-sm text-slate-500">Logs are shown here in reverse chronological order.</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto bg-slate-900 text-slate-100 text-sm font-mono rounded-b-xl">
        {logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="p-3 bg-slate-800 rounded-lg">
                <SyntaxHighlight json={log} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400">No interactions logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
