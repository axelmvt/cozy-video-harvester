
import { motion } from "framer-motion";
import { DownloadForm } from "@/components/DownloadForm";
import { SupportedSites } from "@/components/SupportedSites";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-16 space-y-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            Simple. Fast. Reliable.
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Download From Anywhere
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advanced video downloader supporting multiple platforms and formats.
            Just paste your URL and we'll handle the rest.
          </p>
        </motion.div>

        <div className="flex justify-center">
          <DownloadForm />
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Supported Platforms</h2>
            <p className="text-muted-foreground">
              Download from your favorite platforms with ease
            </p>
          </div>
          <SupportedSites />
        </div>
      </div>
    </div>
  );
};

export default Index;
