
export interface SessionConfig {
  profile: 'Freshman Intern' | 'Pro/Competitive Coder';
  enableExtensionCheck: boolean;
  allowPaste: boolean;
  sessionID: string;
}

export const defaultConfig: SessionConfig = {
  profile: 'Freshman Intern',
  enableExtensionCheck: false,
  allowPaste: false,
  sessionID: ''
};
