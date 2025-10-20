import Button from "@/components/Button";
import Heading from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";

export const About = () => (
  <>
    <Meta title="About" />

    <section className="bg-light">
      <Heading level={1}>About</Heading>
    </section>

    <section>
      <Heading level={2}>Heading 2</Heading>
      <Heading level={3}>Heading 3</Heading>
      <Heading level={4}>Heading 4</Heading>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </p>
    </section>

    <section>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/">Link</Link>
        <Link to="https://google.com">Link</Link>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Button to="">Button</Button>
        <Button to="" color="primary">
          Button
        </Button>
        <Button to="" color="secondary">
          Button
        </Button>
        <Button to="" color="critical">
          Button
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={() => null}>Button</Button>
        <Button onClick={() => null} color="primary">
          Button
        </Button>
        <Button onClick={() => null} color="secondary">
          Button
        </Button>
        <Button onClick={() => null} color="critical">
          Button
        </Button>
      </div>
    </section>
  </>
);

export default About;
