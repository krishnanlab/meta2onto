import { useLocalStorage } from "@reactuses/core";

const userNameKey = "user-name";
const userEmailKey = "user-email";

/** user self-identification */
export const useUser = () => {
  let [userName, setUserName] = useLocalStorage(userNameKey, "");
  let [userEmail, setUserEmail] = useLocalStorage(userEmailKey, "");

  userName ||= "";
  userEmail ||= "";

  return { userName, setUserName, userEmail, setUserEmail };
};
