import svgCaptcha from 'svg-captcha';
import { ICaptchaProvider } from './MathProvider'; // Using the same interface

export class SvgProvider implements ICaptchaProvider {
  constructor(private type: 'alphanumeric' | 'math' = 'alphanumeric') {}

  generate(difficulty: string): { challenge: string; expected_answer: string } {
    let options: Record<string, any> = {
      noise: 2,
      color: true,
      background: '#ffffff', // Explicit background makes it clear
    };

    if (this.type === 'alphanumeric') {
      options = this.applyAlphanumericDifficulty(options, difficulty);
      const captcha = svgCaptcha.create(options);
      return {
        challenge: this.toBase64(captcha.data),
        expected_answer: captcha.text, // The generated string
      };
    } else {
      options = this.applyMathDifficulty(options, difficulty);
      const captcha = svgCaptcha.createMathExpr(options);
      return {
        challenge: this.toBase64(captcha.data),
        expected_answer: captcha.text, // The evaluated math answer as a string
      };
    }
  }

  private applyAlphanumericDifficulty(options: Record<string, any>, difficulty: string): Record<string, any> {
    switch (difficulty) {
      case 'easy':
        options.size = 4;
        options.noise = 1;
        break;
      case 'medium':
        options.size = 5;
        options.noise = 3;
        break;
      case 'difficult':
        options.size = 6;
        options.noise = 5;
        options.ignoreChars = '0Oo1Iil'; // Ignore confusing chars on higher difficulties
        break;
      case 'extreme':
        options.size = 8;
        options.noise = 8;
        options.ignoreChars = '0Oo1Iil';
        break;
      default:
        options.size = 5;
        options.noise = 3;
    }
    return options;
  }

  private applyMathDifficulty(options: Record<string, any>, difficulty: string): Record<string, any> {
    switch (difficulty) {
      case 'easy':
        options.mathMin = 1;
        options.mathMax = 9;
        options.noise = 1;
        break;
      case 'medium':
        options.mathMin = 10;
        options.mathMax = 20;
        options.noise = 3;
        break;
      case 'difficult':
        options.mathMin = 10;
        options.mathMax = 50;
        options.noise = 5;
        options.mathOperator = '+'; // Keep to plus to avoid negative answers 
        break;
      case 'extreme':
        options.mathMin = 50;
        options.mathMax = 99;
        options.noise = 8;
        options.mathOperator = '+'; 
        break;
      default:
        options.mathMin = 10;
        options.mathMax = 20;
        options.noise = 3;
    }
    return options;
  }

  private toBase64(svgString: string): string {
    const base64 = Buffer.from(svgString).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}
