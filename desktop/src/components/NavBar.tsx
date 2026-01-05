import { Database, Download, Upload } from "lucide-react";
import { Button } from "./ui/button";

interface NavBarProps {
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function NavBar({ onExport, onImport }: NavBarProps) {
  return (
    <nav
      className="bg-white border-b border-slate-200"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="px-6 py-4 pl-20">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center space-x-3"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Database Portal
              </h1>
              <p className="text-xs text-slate-500">Desktop Edition</p>
            </div>
          </div>

          <div
            className="flex items-center gap-3"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <label>
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={onImport}
              />
            </label>
            <span className="text-sm text-slate-600 ml-2">v1.0.0</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
