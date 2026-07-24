import agentAvatarImg from '../assets/images/customer_service_avatar_1784779580696.jpg';
import customerAvatarImg from '../assets/images/customer_avatar_new_1784780971469.jpg';

/**
 * Generates a random 20-digit numeric order number.
 * Ensures it starts with 762 (typical TikTok refund order prefix) followed by 17 random digits.
 */
export function generate20DigitOrderNumber(): string {
  const prefix = "7625188";
  let randomSuffix = "";
  for (let i = 0; i < 13; i++) {
    randomSuffix += Math.floor(Math.random() * 10).toString();
  }
  return prefix + randomSuffix;
}

export const AGENT_AVATAR = agentAvatarImg;

export const USER_AVATAR = customerAvatarImg;

export const WANG_XIAOMING_AVATAR = customerAvatarImg;

