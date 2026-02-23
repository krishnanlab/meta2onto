import { Trash2 } from "lucide-react";
import Button from "@/components/Button";
import Heading from "@/components/Heading";
import Meta from "@/components/Meta";

const clearWarning = `
Clear all ${import.meta.env.VITE_TITLE} info saved on this device? No undo.

(Does not affect info already sent to us, such as previously submitted feedback.)
`;

export default function About() {
  return (
    <>
      <Meta title="About" />

      <section className="bg-theme-light">
        <Heading level={1}>About</Heading>
      </section>

      <section>
        <Button
          className="self-center"
          color="accent"
          onClick={() => {
            if (window.confirm(clearWarning)) {
              window.localStorage.clear();
              window.location.reload();
            }
          }}
        >
          <Trash2 />
          Clear Local Data
        </Button>
      </section>

      <section>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </section>
    </>
  );
}
