/**
 * Input Device Mapping Configuration
 * Maps various input devices to InputType
 */

import type { InputType } from '@/types/evaluation';

// Keyboard key to InputType mapping
// Supports both English and Korean input modes
const KEYBOARD_MAPPING: Record<string, InputType> = {
  // 왼손 (Left Hand): A, Q
  'a': 'left-hand', 'A': 'left-hand', 'ㅁ': 'left-hand',
  'q': 'left-hand', 'Q': 'left-hand', 'ㅂ': 'left-hand',

  // 오른손 (Right Hand): S, W
  's': 'right-hand', 'S': 'right-hand', 'ㄴ': 'right-hand',
  'w': 'right-hand', 'W': 'right-hand', 'ㅈ': 'right-hand',

  // 왼발 (Left Foot): D, E
  'd': 'left-foot', 'D': 'left-foot', 'ㅇ': 'left-foot',
  'e': 'left-foot', 'E': 'left-foot', 'ㄷ': 'left-foot',

  // 오른발 (Right Foot): F, R
  'f': 'right-foot', 'F': 'right-foot', 'ㄹ': 'right-foot',
  'r': 'right-foot', 'R': 'right-foot', 'ㄱ': 'right-foot',
  
  // 하위 호환성 (Previous defaults)
  'z': 'left-foot', 'Z': 'left-foot', 'ㅋ': 'left-foot',
  'c': 'right-foot', 'C': 'right-foot', 'ㅊ': 'right-foot',
};

// MIDI note to InputType mapping (example)
const MIDI_MAPPING: Record<number, InputType> = {
  60: 'left-hand',  // C4
  62: 'right-hand', // D4
  64: 'left-foot',  // E4
  65: 'right-foot', // F4
};

// HID button to InputType mapping (example)
const HID_MAPPING: Record<number, InputType> = {
  0: 'left-hand',
  1: 'right-hand',
  2: 'left-foot',
  3: 'right-foot',
};

// Gamepad button to InputType mapping (example)
const GAMEPAD_MAPPING: Record<number, InputType> = {
  0: 'left-hand',  // A button
  1: 'right-hand', // B button
  2: 'left-foot',  // X button
  3: 'right-foot', // Y button
};

// Keyboard labels for display (Primary keys)
export const KEYBOARD_LABELS: Record<InputType, string> = {
  'left-hand': 'A',
  'right-hand': 'S',
  'left-foot': 'D',
  'right-foot': 'F',
};

/**
 * InputDeviceMapper - Maps device inputs to InputType
 */
export class InputDeviceMapper {
  /**
   * Map keyboard key to InputType
   */
  static fromKeyboard(key: string): InputType | null {
    return KEYBOARD_MAPPING[key] || null;
  }

  /**
   * Map MIDI note to InputType
   */
  static fromMIDI(note: number): InputType | null {
    return MIDI_MAPPING[note] || null;
  }

  /**
   * Map HID button to InputType
   */
  static fromHID(button: number): InputType | null {
    return HID_MAPPING[button] || null;
  }

  /**
   * Map Gamepad button to InputType
   */
  static fromGamepad(button: number): InputType | null {
    return GAMEPAD_MAPPING[button] || null;
  }

  /**
   * Get keyboard label for InputType
   */
  static getKeyboardLabel(inputType: InputType): string {
    return KEYBOARD_LABELS[inputType] || '?';
  }
}
