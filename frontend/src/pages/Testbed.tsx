import Button from "@/components/Button";
import Heading from "@/components/Heading";
import Link from "@/components/Link";
import Logo from "@/components/Logo";
import Meta from "@/components/Meta";

export default function Testbed() {
  return (
    <>
      <Meta title="Testbed" />

      <section className="bg-theme-light">
        <Heading level={1}>Testbed</Heading>
      </section>

      <section>
        <Heading level={2}>Heading 2</Heading>
        <Heading level={3}>Heading 3</Heading>
        <Heading level={4}>Heading 4</Heading>

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

      <section>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/">Link</Link>
          <Link to="https://google.com">Link</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Button to="" color="none">
            Button
          </Button>
          <Button to="" color="theme">
            Button
          </Button>
          <Button to="" color="accent">
            Button
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => null} color="none">
            Button
          </Button>
          <Button onClick={() => null} color="theme">
            Button
          </Button>
          <Button onClick={() => null} color="accent">
            Button
          </Button>
        </div>
      </section>

      <section>
        <div className="bg-theme-light size-64">
          <Logo />
        </div>

        <div className="bg-theme-light text-theme flex h-100 w-150 items-center justify-center gap-5 text-[50px]">
          <Logo className="size-25" />
          <span>
            <span className="">Meta</span>
            <span className="text-theme-dark">2</span>
            <span className="text-accent">Onto</span>
          </span>
        </div>
      </section>
    </>
  );
}
