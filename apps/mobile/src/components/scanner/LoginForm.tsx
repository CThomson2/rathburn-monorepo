
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface LoginFormProps {
  onSuccessfulLogin: (username: string) => void;
}

const LoginForm = ({ onSuccessfulLogin }: LoginFormProps) => {
  const [passcode, setPasscode] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const { toast } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const maxAttempts = 5;

  // Mock valid passcode and username (in a real app, this would be verified against a database)
  const validPasscode = '123456';
  const username = 'Operator';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    if (value.length <= 1 && /^\d*$/.test(value)) {
      // Update the passcode
      const newPasscode = passcode.split('');
      newPasscode[index] = value;
      setPasscode(newPasscode.join(''));
      
      // Move to next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // If backspace is pressed and the field is empty, move to previous field
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passcode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Incomplete Passcode",
        description: "Please enter a 6-digit passcode."
      });
      return;
    }
    
    if (passcode === validPasscode) {
      onSuccessfulLogin(username);
      toast({
        title: "Login Successful",
        description: `Welcome, ${username}!`,
        className: "bg-industrial-green text-white"
      });
    } else {
      setAttempts(attempts + 1);
      setIsError(true);
      setTimeout(() => setIsError(false), 2000);
      
      if (attempts + 1 >= maxAttempts) {
        toast({
          variant: "destructive",
          title: "Login Locked",
          description: "Too many failed attempts. Please contact support."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Passcode",
          description: `${maxAttempts - attempts - 1} attempts remaining.`
        });
        setPasscode('');
        inputRefs.current[0]?.focus();
      }
    }
  };

  useEffect(() => {
    // Focus the first input when the component mounts
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="w-full max-w-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-industrial-darkGray">Industrial Scanner</h1>
          <p className="text-industrial-gray mt-2">Enter your 6-digit passcode</p>
        </div>
        
        <div className="flex justify-center space-x-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={passcode[index] || ''}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-md border-2 
                ${isError 
                  ? 'border-industrial-red bg-red-50 text-industrial-red animate-pulse' 
                  : 'border-industrial-lightGray focus:border-industrial-blue focus:ring-1 focus:ring-industrial-blue'
                } transition-colors`}
              disabled={attempts >= maxAttempts}
            />
          ))}
        </div>
        
        <Button 
          type="submit" 
          className={`w-full py-6 text-lg font-medium ${isError ? 'bg-industrial-red' : 'bg-industrial-blue hover:bg-industrial-lightBlue'}`}
          disabled={attempts >= maxAttempts || passcode.length !== 6}
        >
          Login
        </Button>
        
        {attempts >= maxAttempts && (
          <div className="text-center text-industrial-red">
            Account locked. Please contact support.
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
