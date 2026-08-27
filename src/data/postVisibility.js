import { FaGlobeAsia, FaUserFriends, FaLock } from "react-icons/fa";

export const visibilityMeta = {
  PUBLIC: { icon: FaGlobeAsia, label: "Công khai" },
  FRIENDS: { icon: FaUserFriends, label: "Bạn bè" },
  PRIVATE: { icon: FaLock, label: "Chỉ mình tôi" },
};

export const visibilityOptions = [
  { value: "PUBLIC", ...visibilityMeta.PUBLIC },
  { value: "FRIENDS", ...visibilityMeta.FRIENDS },
  { value: "PRIVATE", ...visibilityMeta.PRIVATE },
];
