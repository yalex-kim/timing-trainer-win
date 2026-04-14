/**
 * Input Device Mapping Configuration
 * Maps various input devices to InputType
 */

import type { InputType } from '@/types/evaluation';

// Keyboard key to InputType mapping
const KEYBOARD_MAPPING: Record<string, InputType> = {
  // 왼손 (Left Hand): E
  'e': 'left-hand', 'E': 'left-hand',

  // 오른손 (Right Hand): I
  'i': 'right-hand', 'I': 'right-hand',

  // 왼발 (Left Foot): C
  'c': 'left-foot', 'C': 'left-foot',

  // 오른발 (Right Foot): M
  'm': 'right-foot', 'M': 'right-foot',
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
  'left-hand': 'E',
  'right-hand': 'I',
  'left-foot': 'C',
  'right-foot': 'M',
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
