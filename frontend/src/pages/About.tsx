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
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="https://coolors.co">Link</Link>
        <Button to="https://coolors.co">Button</Button>
        <Button to="https://coolors.co" color="secondary">
          Button
        </Button>
        <Button onClick={() => console.info("click")} color="critical">
          Button
        </Button>
      </div>
    </section>
  </>
);

export default About;
