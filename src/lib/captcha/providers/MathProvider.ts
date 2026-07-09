export interface ICaptchaProvider {
  generate(difficulty: string): { challenge: string; expectedAnswer: string }
}

export class MathProvider implements ICaptchaProvider {
  generate(difficulty: string): { challenge: string; expectedAnswer: string } {
    switch (difficulty) {
      case 'easy':
        return this.generateEasy()
      case 'medium':
        return this.generateMedium()
      case 'difficult':
        return this.generateDifficult()
      case 'extreme':
        return this.generateExtreme()
      default:
        return this.generateDifficult()
    }
  }

  /** Easy: single-digit addition or subtraction (e.g. 3 + 5, 9 - 4) */
  private generateEasy() {
    const ops = ['+', '−'] as const
    const op = ops[this.randomInt(0, 1)]
    if (op === '+') {
      const a = this.randomInt(1, 9), b = this.randomInt(1, 9)
      return { challenge: `${a} + ${b}`, expectedAnswer: String(a + b) }
    }
    // Subtraction: ensure non-negative result
    const a = this.randomInt(2, 9), b = this.randomInt(1, a)
    return { challenge: `${a} − ${b}`, expectedAnswer: String(a - b) }
  }

  /** Medium: two-digit addition/subtraction (e.g. 34 + 17, 52 − 28) */
  private generateMedium() {
    const ops = ['+', '−'] as const
    const op = ops[this.randomInt(0, 1)]
    if (op === '+') {
      const a = this.randomInt(10, 49), b = this.randomInt(10, 49)
      return { challenge: `${a} + ${b}`, expectedAnswer: String(a + b) }
    }
    const a = this.randomInt(30, 99), b = this.randomInt(10, a - 1)
    return { challenge: `${a} − ${b}`, expectedAnswer: String(a - b) }
  }

  /** Difficult: multiplication / multi-step (e.g. 12 × 7, 45 + 18 − 9) */
  private generateDifficult() {
    const type = this.randomInt(0, 2)
    if (type === 0) {
      // Two-digit × single-digit
      const a = this.randomInt(11, 25), b = this.randomInt(3, 9)
      return { challenge: `${a} × ${b}`, expectedAnswer: String(a * b) }
    }
    if (type === 1) {
      // Three-number add/sub chain
      const a = this.randomInt(20, 60), b = this.randomInt(10, 30), c = this.randomInt(5, 20)
      const answer = a + b - c
      return { challenge: `${a} + ${b} − ${c}`, expectedAnswer: String(answer) }
    }
    // Division with clean result
    const divisor = this.randomInt(3, 9)
    const quotient = this.randomInt(5, 15)
    const dividend = divisor * quotient
    return { challenge: `${dividend} ÷ ${divisor}`, expectedAnswer: String(quotient) }
  }

  /** Extreme: multi-step with multiply + add (e.g. 7 × 8 + 13) */
  private generateExtreme() {
    const type = this.randomInt(0, 1)
    if (type === 0) {
      const a = this.randomInt(6, 12), b = this.randomInt(6, 12), c = this.randomInt(10, 50)
      const answer = a * b + c
      return { challenge: `${a} × ${b} + ${c}`, expectedAnswer: String(answer) }
    }
    // Multi-step with parentheses hint
    const a = this.randomInt(20, 80), b = this.randomInt(10, 30), c = this.randomInt(2, 5)
    const answer = (a + b) * c
    return { challenge: `(${a} + ${b}) × ${c}`, expectedAnswer: String(answer) }
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}
