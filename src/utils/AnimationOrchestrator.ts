/**
 * Urkio Animation Orchestrator
 * Maps AI-detected emotional sentiment to character animation states.
 */

export type AnimationState = 'stress' | 'neutral' | 'positive' | 'thinking' | 'talking';

export interface CharacterMetadata {
  id: string;
  name: string;
  assetPath: string; // Path to Lottie/SVG/JSON
  states: Record<AnimationState, any>;
}

export const SENTIMENT_LEVELS = {
  STRESS: 0.3,
  NEUTRAL: 0.7,
  POSITIVE: 1.0,
};

export class AnimationOrchestrator {
  /**
   * Determine the animation state based on a sentiment score (0.0 - 1.0)
   */
  static getAnimationState(sentiment: number): AnimationState {
    if (sentiment <= SENTIMENT_LEVELS.STRESS) {
      return 'stress'; // Maps to "Soothing Guide"
    }
    if (sentiment <= SENTIMENT_LEVELS.NEUTRAL) {
      return 'neutral'; // Maps to "Active Listener"
    }
    return 'positive'; // Maps to "Success/Celebration"
  }

  /**
   * Get the character configuration from the Stitch/Asset library
   */
  static async getCharacterConfig(characterId: string): Promise<CharacterMetadata> {
    // Mock implementation for current build phase
    // In production, this would fetch from Data Connect or Stitch assets
    return {
      id: characterId,
      name: 'Homii Guide',
      assetPath: `/assets/characters/${characterId}.json`,
      states: {
        stress: { animation: 'calm_breathing', speed: 1 },
        neutral: { animation: 'gentle_nod', speed: 1.2 },
        positive: { animation: 'celebrate', speed: 1.5 },
        thinking: { animation: 'think', speed: 1 },
        talking: { animation: 'talk', speed: 1 },
      }
    };
  }
}

/**
 * React Hook for real-time animation orchestration
 */
import { useState, useEffect } from 'react';

export function useAnimationOrchestrator(sentimentScore: number) {
  const [currentState, setCurrentState] = useState<AnimationState>('neutral');

  useEffect(() => {
    const newState = AnimationOrchestrator.getAnimationState(sentimentScore);
    setCurrentState(newState);
  }, [sentimentScore]);

  return currentState;
}
