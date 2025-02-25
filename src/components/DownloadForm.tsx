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
      console.log("Making request to:", `${import.meta.env.VITE_API_URL}/download`);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/download`, {
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
        window.location.href = `${import.meta.env.VITE_API_URL}${download_url}`;
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
      console.log("Testing connection to:", `${import.meta.env.VITE_API_URL}/network-test`);
      console.log("VITE_API_URL value:", import.meta.env.VITE_API_URL);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/network-test`, {
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
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
        onClick={() => {
          console.log("Testing direct connection to backend");
          fetch('http://backend:5000/network-test', {
            mode: 'cors',
            cache: 'no-cache'
          })
            .then(response => response.json())
            .then(data => {
              console.log("Direct test result:", data);
              toast({
                title: "Direct Test Success",
                description: "Backend connection is working with direct URL",
                duration: 5000,
              });
            })
            .catch(error => {
              console.error("Direct test error:", error);
              toast({
                title: "Direct Test Failed",
                description: error.message,
                variant: "destructive",
              });
              
              // Try another direct URL as fallback
              console.log("Trying fallback URL");
              return fetch('http://192.168.147.2:5000/network-test', {
                mode: 'cors', 
                cache: 'no-cache'
              });
            })
            .then(response => response?.json())
            .then(data => {
              if (data) {
                console.log("Fallback test result:", data);
                toast({
                  title: "Fallback Test Success",
                  description: "Backend connection works with IP address",
                  duration: 5000,
                });
              }
            })
            .catch(error => {
              console.error("Fallback test error:", error);
            });
        }}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/80 h-10 px-4 py-2 w-full mt-4"
      >
        Test Direct Connection
      </button>
    </motion.form>
  );
}
