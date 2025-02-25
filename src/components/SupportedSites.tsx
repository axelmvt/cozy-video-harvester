
import { motion } from "framer-motion";
import { Youtube, Facebook, Twitter, Instagram } from "lucide-react";

const sites = [
  {
    name: "YouTube",
    icon: Youtube,
    description: "Download videos and playlists",
  },
  {
    name: "Facebook",
    icon: Facebook,
    description: "Save videos and stories",
  },
  {
    name: "Twitter",
    icon: Twitter,
    description: "Download tweets with media",
  },
  {
    name: "Instagram",
    icon: Instagram,
    description: "Save posts and stories",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function SupportedSites() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl mx-auto px-4"
    >
      {sites.map((site) => (
        <motion.div
          key={site.name}
          variants={item}
          className="glass rounded-lg p-6 flex flex-col items-center text-center space-y-4"
        >
          <site.icon className="h-8 w-8 text-primary" />
          <h3 className="font-semibold">{site.name}</h3>
          <p className="text-sm text-muted-foreground">{site.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
