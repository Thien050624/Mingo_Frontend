const avatar = (seed) => `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;
const photo = (seed, w = 600, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const currentUser = {
  id: "u1",
  name: "Trọng Thiên",
  email: "trongthien@mingo.vn",
  avatar: avatar("trongthien"),
  bio: "Sống chậm lại, nghĩ khác đi, yêu thương nhiều hơn 🌿",
  location: "TP. Hồ Chí Minh",
  work: "Sinh viên TMA",
  gender: "",
  friendsCount: 128,
  followersCount: 342,
};

// `hair[]` pins one exact DiceBear "notionists" hair variant (of 63) instead of letting the
// seed pick randomly; hairProbability=100 guarantees hair always renders (never bald/hat).
// Variant numbers were chosen by measuring each variant's path bounding box — the ones listed
// under "short" stay within the scalp area, the ones under "long" extend well past the shoulders.
const SHORT_HAIR_VARIANTS = ["variant07", "variant56", "variant15", "variant35"];
const LONG_HAIR_VARIANTS = ["variant46", "variant63", "variant08", "variant41"];

const genderedAvatar = (seed, hairVariant) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&hair[]=${hairVariant}&hairProbability=100`;

export const suggestedAvatars = [
  { seed: "onboard-male-1", gender: "Nam", hair: SHORT_HAIR_VARIANTS[0] },
  { seed: "onboard-male-2", gender: "Nam", hair: SHORT_HAIR_VARIANTS[1] },
  { seed: "onboard-male-3", gender: "Nam", hair: SHORT_HAIR_VARIANTS[2] },
  { seed: "onboard-male-4", gender: "Nam", hair: SHORT_HAIR_VARIANTS[3] },
  { seed: "onboard-female-1", gender: "Nữ", hair: LONG_HAIR_VARIANTS[0] },
  { seed: "onboard-female-2", gender: "Nữ", hair: LONG_HAIR_VARIANTS[1] },
  { seed: "onboard-female-3", gender: "Nữ", hair: LONG_HAIR_VARIANTS[2] },
  { seed: "onboard-female-4", gender: "Nữ", hair: LONG_HAIR_VARIANTS[3] },
].map(({ seed, gender, hair }) => ({
  src: genderedAvatar(seed, hair),
  gender,
}));

export const people = [
  {
    id: "u2",
    name: "Minh Anh",
    avatar: avatar("minhanh"),
    bio: "Cà phê, sách và những chuyến đi ngẫu hứng ☕📚",
    work: "Thiết kế đồ hoạ tự do",
    location: "Đà Lạt",
    friendsCount: 96,
    followersCount: 210,
    mutual: 12,
    online: true,
  },
  {
    id: "u3",
    name: "Quốc Bảo",
    avatar: avatar("quocbao"),
    bio: "Lập trình viên ban ngày, game thủ ban đêm 🎮",
    work: "Kỹ sư phần mềm tại FPT",
    location: "TP. Hồ Chí Minh",
    friendsCount: 143,
    followersCount: 302,
    mutual: 8,
    online: true,
  },
  {
    id: "u4",
    name: "Thuỳ Linh",
    avatar: avatar("thuylinh"),
    bio: "Yêu động vật, yêu cây cối, yêu cuộc sống 🌱🐾",
    work: "Bác sĩ thú y",
    location: "Hà Nội",
    friendsCount: 187,
    followersCount: 421,
    mutual: 21,
    online: false,
  },
  {
    id: "u5",
    name: "Đức Huy",
    avatar: avatar("duchuy"),
    bio: "Chạy bộ mỗi sáng, chụp ảnh mỗi chiều 🏃📷",
    work: "Nhiếp ảnh gia tự do",
    location: "Vũng Tàu",
    friendsCount: 74,
    followersCount: 156,
    mutual: 5,
    online: true,
  },
  {
    id: "u6",
    name: "Ngọc Hà",
    avatar: avatar("ngocha"),
    bio: "Người kể chuyện qua từng món ăn 🍜✨",
    work: "Food blogger",
    location: "Đà Nẵng",
    friendsCount: 58,
    followersCount: 890,
    mutual: 3,
    online: false,
  },
  {
    id: "u7",
    name: "Anh Tuấn",
    avatar: avatar("anhtuan"),
    bio: "Âm nhạc là ngôn ngữ chung của mọi tâm hồn 🎸",
    work: "Nhạc sĩ",
    location: "TP. Hồ Chí Minh",
    friendsCount: 211,
    followersCount: 1024,
    mutual: 17,
    online: true,
  },
];

export const allUsers = [currentUser, ...people];
export const getUserById = (id) => allUsers.find((u) => u.id === id);

export const trendingTopics = [
  { id: "t1", tag: "#MingoApp", posts: 1284, heat: 96 },
  { id: "t2", tag: "#DaLatTrip", posts: 842, heat: 78 },
  { id: "t3", tag: "#SinhVienTMA", posts: 611, heat: 65 },
  { id: "t4", tag: "#HoangHonVungTau", posts: 430, heat: 52 },
  { id: "t5", tag: "#WeekendVibes", posts: 305, heat: 40 },
];

const reactionSet = ["like", "love", "haha", "wow", "sad", "angry"];
export const reactionIcons = {
  like: "👍",
  love: "❤️",
  haha: "😆",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

export const posts = [
  {
    id: "p1",
    author: people[0],
    time: "2 giờ trước",
    content: "Cuối tuần này đi cà phê Đà Lạt không mọi người ☕🌸 view đẹp xỉu luôn!",
    images: [photo("post1a", 700, 450), photo("post1b", 700, 450)],
    reactions: { like: 24, love: 12, haha: 2, wow: 0, sad: 0, angry: 0 },
    myReaction: null,
    comments: [
      { id: "c1", author: people[1], content: "Đi đi đi, e đăng ký 1 chân 🙋‍♀️", time: "1 giờ trước" },
      { id: "c2", author: people[2], content: "Cho tui theo với!", time: "45 phút trước" },
    ],
  },
  {
    id: "p2",
    author: currentUser,
    time: "5 giờ trước",
    content: "Vừa deploy xong dự án Mingo 🎉 mọi người vào ủng hộ nha! #MingoApp #SocialMiniApp",
    images: [photo("post2", 700, 450)],
    reactions: { like: 56, love: 30, haha: 1, wow: 4, sad: 0, angry: 0 },
    myReaction: "love",
    comments: [
      { id: "c3", author: people[3], content: "Đỉnh quá trời, giao diện nhìn quen quen 😄", time: "3 giờ trước" },
    ],
  },
  {
    id: "p3",
    author: people[3],
    time: "1 ngày trước",
    content: "Chúc mọi người cuối tuần vui vẻ nha ❤️",
    images: [],
    reactions: { like: 10, love: 5, haha: 0, wow: 0, sad: 0, angry: 0 },
    myReaction: null,
    comments: [],
  },
  {
    id: "p4",
    author: people[4],
    time: "2 ngày trước",
    content: "Ảnh chụp hoàng hôn hôm qua ở Vũng Tàu, đẹp không chịu nổi 🌅",
    images: [
      photo("post4a", 700, 500),
      photo("post4b", 700, 500),
      photo("post4c", 700, 500),
      photo("post4d", 700, 500),
    ],
    reactions: { like: 88, love: 41, haha: 0, wow: 15, sad: 0, angry: 0 },
    myReaction: null,
    comments: [
      { id: "c4", author: people[0], content: "Xin link full res với ạ 😍", time: "1 ngày trước" },
      { id: "c5", author: currentUser, content: "Đẹp quá!!", time: "20 giờ trước" },
    ],
  },
  {
    id: "p5",
    author: people[5],
    time: "3 ngày trước",
    content: "Team building công ty cuối tuần vừa rồi, quẩy hết mình 🎉",
    images: [photo("post5a", 700, 500), photo("post5b", 700, 500), photo("post5c", 700, 500)],
    reactions: { like: 34, love: 9, haha: 6, wow: 0, sad: 0, angry: 0 },
    myReaction: null,
    comments: [],
  },
];

export const conversations = [
  {
    id: "conv1",
    user: people[0],
    online: true,
    lastMessage: "Ok hẹn 8h nha!",
    time: "2 phút",
    unread: 2,
    messages: [
      { id: "m1", from: "them", text: "Ê mai đi học không?", time: "09:12" },
      { id: "m2", from: "me", text: "Có chứ, mấy giờ?", time: "09:13" },
      { id: "m3", from: "them", text: "8h nha, tao qua đón", time: "09:14" },
      { id: "m4", from: "me", text: "Ok hẹn 8h nha!", time: "09:15" },
    ],
  },
  {
    id: "conv2",
    user: people[1],
    online: true,
    lastMessage: "Gửi bạn file bài tập rồi đó",
    time: "20 phút",
    unread: 0,
    messages: [
      { id: "m5", from: "them", text: "Gửi bạn file bài tập rồi đó", time: "08:50" },
      { id: "m6", from: "me", text: "Thanks bạn nhiều!", time: "08:52" },
    ],
  },
  {
    id: "conv3",
    user: people[2],
    online: false,
    lastMessage: "Hẹn gặp lại sau nhé 👋",
    time: "1 giờ",
    unread: 0,
    messages: [{ id: "m7", from: "them", text: "Hẹn gặp lại sau nhé 👋", time: "07:30" }],
  },
  {
    id: "conv4",
    user: people[3],
    online: false,
    lastMessage: "Bạn: Deal xong nha",
    time: "3 giờ",
    unread: 0,
    messages: [{ id: "m8", from: "me", text: "Deal xong nha", time: "05:10" }],
  },
  {
    id: "conv5",
    user: people[4],
    online: true,
    lastMessage: "Haha đúng rồi đó 😂",
    time: "5 giờ",
    unread: 5,
    messages: [{ id: "m9", from: "them", text: "Haha đúng rồi đó 😂", time: "03:00" }],
  },
];

export const notifications = [
  {
    id: "n1",
    user: people[0],
    type: "like",
    content: "đã thích bài viết của bạn",
    time: "5 phút trước",
    unread: true,
  },
  {
    id: "n2",
    user: people[1],
    type: "comment",
    content: "đã bình luận về bài viết của bạn: \"Đỉnh quá trời!\"",
    time: "30 phút trước",
    unread: true,
  },
  {
    id: "n3",
    user: people[2],
    type: "follow",
    content: "đã bắt đầu theo dõi bạn",
    time: "1 giờ trước",
    unread: true,
  },
  {
    id: "n4",
    user: people[3],
    type: "friend",
    content: "đã gửi lời mời kết bạn",
    time: "2 giờ trước",
    unread: false,
  },
  {
    id: "n5",
    user: people[4],
    type: "like",
    content: "và 12 người khác đã thích bài viết của bạn",
    time: "1 ngày trước",
    unread: false,
  },
  {
    id: "n6",
    user: people[5],
    type: "comment",
    content: "đã nhắc đến bạn trong một bình luận",
    time: "2 ngày trước",
    unread: false,
  },
];

export const reactionKeys = reactionSet;

export const forumMessages = [
  { id: "fm1", author: people[1], content: "Chào cả nhà, phòng chat chung của Mingo đây 👋", time: "09:02" },
  { id: "fm2", author: people[3], content: "Chào mọi người! Có ai học React cùng mình không, mình mới học được 2 tuần 🙏", time: "09:05" },
  { id: "fm3", author: currentUser, content: "Mình học được 3 tháng rồi, có gì cứ hỏi nha!", time: "09:07" },
  { id: "fm4", author: people[4], content: "Ê tham gia group học chung của tụi mình không?", time: "09:08" },
  { id: "fm5", author: currentUser, content: "Mọi người thấy giao diện dark mode của Mingo thế nào? Góp ý thoải mái nhé!", time: "09:15" },
  { id: "fm6", author: people[2], content: "Đẹp lắm, đặc biệt là phần neon glow á 😍", time: "09:16" },
  { id: "fm7", author: people[5], content: "Nên có thêm chế độ light mode cho ai thích sáng", time: "09:17" },
  { id: "fm8", author: people[0], content: "Đồng ý, mà dark mode này quá ổn rồi", time: "09:18" },
  { id: "fm9", author: people[3], content: "Cuối tuần này có ai đi phượt Đà Lạt không? Team mình còn thiếu vài chỗ trên xe 🚗", time: "09:30" },
  { id: "fm10", author: people[1], content: "Cho mình xin thông tin chi tiết với!", time: "09:32" },
  { id: "fm11", author: people[5], content: "Dạo này mình hay nghe lofi với acoustic khi code, mọi người có playlist nào hay ho thì thả vào đây nha 🎵", time: "09:40" },
  { id: "fm12", author: people[4], content: "Mình sắp phỏng vấn thực tập vị trí Frontend, có anh chị nào có kinh nghiệm chia sẻ giúp em với ạ 🥲", time: "09:45" },
  { id: "fm13", author: currentUser, content: "Cứ tự tin thể hiện project cá nhân là được á, chúc may mắn!", time: "09:46" },
  { id: "fm14", author: people[2], content: "Chuẩn bị kỹ về giải thuật với 1 project demo là ổn", time: "09:47" },
  { id: "fm15", author: people[5], content: "Ráng luyện thêm tiếng Anh giao tiếp nữa nha", time: "09:48" },
];
