import { 
  Search, Lightbulb, Scale, Map, FilePen, 
  Users, Scissors, Sparkles, Images, Mic, 
  AudioLines, SlidersHorizontal, FolderSearch, Clapperboard, Share2, BadgeCheck,
  LucideIcon
} from "lucide-react";

export interface StepConfig {
  id: number;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const STEPS: StepConfig[] = [
  { id: 1, label: 'Research', icon: Search, description: 'Builds the initial research brief for the episode.' },
  { id: 2, label: 'Angles', icon: Lightbulb, description: 'Generates creative angles and thesis options.' },
  { id: 3, label: 'Evaluate', icon: Scale, description: 'Evaluates angles against channel strategy.' },
  { id: 4, label: 'Blueprint', icon: Map, description: 'Builds the narrative structural blueprint.' },
  { id: 5, label: 'Drafts', icon: FilePen, description: 'Generates multiple script versions based on the blueprint.' },
  { id: 6, label: 'Board', icon: Users, description: 'Multi-agent script evaluation.' },
  { id: 7, label: 'Master', icon: Scissors, description: 'Master cut script builder.' },
  { id: 8, label: 'Polish', icon: Sparkles, description: 'Layered rewrite & final polish.' },
  { id: 9, label: 'Visuals', icon: Images, description: 'Visual layer builder.' },
  { id: 10, label: 'Voice', icon: Mic, description: 'Voice production plan.' },
  { id: 11, label: 'Narration', icon: AudioLines, description: 'AI narration generation.' },
  { id: 12, label: 'Audio', icon: SlidersHorizontal, description: 'Audio cleanup & podcast master.' },
  { id: 13, label: 'Assets', icon: FolderSearch, description: 'Asset sourcing & rights check.' },
  { id: 14, label: 'Assembly', icon: Clapperboard, description: 'Long-form video assembly.' },
  { id: 15, label: 'Derivatives', icon: Share2, description: 'Derivatives package generation.' },
  { id: 16, label: 'Publish', icon: BadgeCheck, description: 'Final QA, export & publish.' },
];
