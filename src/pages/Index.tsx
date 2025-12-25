/**
 * Homepage - Simple welcome page
 */
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-primary/20 p-6 rounded-full">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to EduTrackers
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground max-w-md">
          A simple education tracking website for students and teachers.
        </p>

        {/* Button */}
        <Button size="lg" className="mt-4">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
