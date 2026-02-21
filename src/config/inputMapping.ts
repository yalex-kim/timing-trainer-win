/**
 * Input Device Mapping Configuration
 * Maps various input devices to InputType
 */

import type { InputType } from '@/types/evaluation';

// Keyboard key to InputType mapping
const KEYBOARD_MAPPING: Record<string, InputType> = {
  'a': 'left-hand',
  'A': 'left-hand',
  'd': 'right-hand',
  'D': 'right-hand',
  'z': 'left-foot',
  'Z': 'left-foot',
  'c': 'right-foot',
  'C': 'right-foot',
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

// Keyboard labels for display
export const KEYBOARD_LABELS: Record<InputType, string> = {
  'left-hand': 'A',
  'right-hand': 'D',
  'left-foot': 'Z',
  'right-foot': 'C',
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
