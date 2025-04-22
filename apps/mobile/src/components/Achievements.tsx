
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  unlocked: boolean;
}

const mockAchievements: Achievement[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Complete your first 10 scans",
    progress: 7,
    total: 10,
    unlocked: false
  },
  {
    id: "2",
    title: "Speed Runner",
    description: "Complete 50 scans in one day",
    progress: 32,
    total: 50,
    unlocked: false
  },
  {
    id: "3",
    title: "Inventory Master",
    description: "Process 100 inventory checks",
    progress: 100,
    total: 100,
    unlocked: true
  },
  {
    id: "4",
    title: "Perfect Week",
    description: "Log in 7 days in a row",
    progress: 5,
    total: 7,
    unlocked: false
  }
];

const Achievements = () => {
  const calculateLevel = (achievements: Achievement[]) => {
    const totalUnlocked = achievements.filter(a => a.unlocked).length;
    return Math.floor(totalUnlocked / 3) + 1;
  };

  const currentLevel = calculateLevel(mockAchievements);
  const totalAchievements = mockAchievements.length;
  const unlockedAchievements = mockAchievements.filter(a => a.unlocked).length;

  return (
    <div className="w-full p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-industrial-blue" />
            <h2 className="text-xl font-bold text-industrial-darkGray">Level {currentLevel}</h2>
          </div>
          <Badge variant="outline" className="bg-industrial-lightBlue/10">
            {unlockedAchievements}/{totalAchievements} Achieved
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-3 pr-4">
          {mockAchievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={`p-4 ${
                achievement.unlocked 
                  ? "border-l-4 border-l-industrial-green" 
                  : "border-l-4 border-l-industrial-gray"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${
                    achievement.unlocked 
                      ? "text-industrial-green" 
                      : "text-industrial-gray"
                  }`} />
                  <span className="font-medium text-industrial-darkGray">
                    {achievement.title}
                  </span>
                </div>
                {achievement.unlocked && (
                  <Badge variant="default" className="bg-industrial-green">
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-industrial-gray mb-2">
                {achievement.description}
              </p>
              <Progress
                value={(achievement.progress / achievement.total) * 100}
                className="h-2"
              />
              <p className="text-xs text-industrial-gray mt-1 text-right">
                {achievement.progress}/{achievement.total}
              </p>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Achievements;
