import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DownloadFormData = {
  url: string;
  downloadType: "video" | "audio";
  format?: string;
  quality?: string;
  subtitles?: string;
  directDownload: boolean;
};

// Use a local API URL that will be proxied by Vite's dev server
const API_BASE_URL = '/api';

export function DownloadForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<DownloadFormData>({
    url: "",
    downloadType: "video",
    directDownload: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Making request to:", `${API_BASE_URL}/download`);
      const response = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: formData.url,
          type: formData.downloadType,
          directDownload: formData.directDownload
        }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = 'Unknown error occurred';
        try {
          const errorResponse = await response.json();
          errorMessage = errorResponse.error || errorResponse.message || JSON.stringify(errorResponse);
        } catch (jsonError) {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      if (formData.directDownload) {
        const { download_url } = await response.json();
        console.log("Direct download URL:", download_url);
        window.location.href = `${API_BASE_URL}${download_url}`;
      } else {
        const result = await response.json();
        console.log("Success response:", result);
        toast({
          title: "Success",
          description: `Video "${result.title}" is ready for download`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log("Testing connection to:", `${API_BASE_URL}/network-test`);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/network-test`, {
        signal: controller.signal,
        cache: 'no-cache' // Disable caching
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Network test result:", result);
      toast({
        title: "Test Success",
        description: "Backend connection is working",
        duration: 5000,
      });
    } catch (error) {
      console.error('Test error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error instanceof TypeError ? 'TypeError' : 
              error instanceof DOMException ? 'DOMException' : 
              error instanceof Error ? 'Error' : 'Unknown'
      });
      
      let errorMessage = error instanceof Error ? error.message : "Failed to test connection";
      
      // Provide more detailed error feedback based on error type
      if (error.name === 'AbortError') {
        errorMessage = "Connection timed out. The backend may be unreachable.";
      } else if (error instanceof TypeError) {
        errorMessage = `Network error: ${error.message}. Check if backend URL is correct.`;
      }
      
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const checkVersion = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/version`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log("Version information:", result);
      toast({
        title: "Version Info",
        description: `yt-dlp: ${result.yt_dlp_version}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Version check error:', error);
      toast({
        title: "Version Check Failed",
        description: error instanceof Error ? error.message : "Failed to check version",
        variant: "destructive",
      });
    }
  };

  const updateYtDlp = async () => {
    try {
      setLoading(true);
      toast({
        title: "Updating yt-dlp",
        description: "This may take a minute...",
        duration: 5000,
      });
      
      const response = await fetch(`${API_BASE_URL}/update-ytdlp`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Update result:", result);
      
      toast({
        title: "Update Successful",
        description: `yt-dlp updated to version: ${result.new_version}`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update yt-dlp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="w-full max-w-xl space-y-6"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Video URL
          </label>
          <input
            type="url"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
            placeholder="Enter video URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Download Type
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
            value={formData.downloadType}
            onChange={(e) => setFormData({ ...formData, downloadType: e.target.value as "video" | "audio" })}
          >
            <option value="video">Video (default)</option>
            <option value="audio">Audio Only</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Format (optional)
          </label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
            placeholder="e.g., mp4, mkv, mp3"
            value={formData.format || ""}
            onChange={(e) => setFormData({ ...formData, format: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Video Quality (optional)
          </label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
            placeholder="e.g., 720, 1080"
            value={formData.quality || ""}
            onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="directDownload"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={formData.directDownload}
            onChange={(e) => setFormData({ ...formData, directDownload: e.target.checked })}
          />
          <label
            htmlFor="directDownload"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Direct Download
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Download
          </>
        )}
      </button>

      <button
        type="button"
        onClick={testConnection}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full mt-4"
      >
        Test Backend Connection
      </button>
      
      <button
        type="button"
        onClick={checkVersion}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full mt-2"
      >
        Check yt-dlp Version
      </button>
      
      <button
        type="button"
        onClick={updateYtDlp}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-accent text-accent-foreground hover:bg-accent/80 h-10 px-4 py-2 w-full mt-2"
      >
        Update yt-dlp to Latest Version
      </button>
      
      <div className="text-xs text-gray-500 mt-4 p-3 bg-muted rounded">
        <p className="font-semibold mb-1">Troubleshooting Tips:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>If downloads fail, update yt-dlp to the latest version</li>
          <li>Try audio-only downloads if video downloads fail</li>
          <li>Some YouTube videos may have restrictions that prevent downloading</li>
          <li>Try a different video URL if you continue to get errors</li>
        </ul>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        API Base URL: {API_BASE_URL} (Proxied to backend)
      </div>
    </motion.form>
  );
}
