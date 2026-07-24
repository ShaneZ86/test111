import customerAvatarImg from '../assets/customer_avatar.svg';

const SURNAMES = ['张', '李', '王', '赵', '陈', '刘', '杨', '黄', '吴', '周', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
const GIVEN_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '浩', '嘉欣', '语嫣', '雨桐', '子轩', '宇轩', '博', '思宇', '建国', '文静', '海燕', '志强'];

const AVATARS = [
  customerAvatarImg
];

export function generateRandomChineseName(): string {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const givenName = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
  return surname + givenName;
}

export function getRandomUserAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

