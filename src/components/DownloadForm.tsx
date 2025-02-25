
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
      // Make API call to Flask backend
      const response = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formData.url,
          format: formData.format || 'mp4',
          type: formData.downloadType,
          quality: formData.quality || 'best',
          direct_download: formData.directDownload,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      if (formData.directDownload) {
        // For direct downloads, get the download URL and trigger browser download
        const { download_url } = await response.json();
        window.location.href = `http://localhost:5000${download_url}`;
      } else {
        // For non-direct downloads, show success message with the video info
        const result = await response.json();
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
    </motion.form>
  );
}
