import Heading from "@/components/Heading";
import Meta from "@/components/Meta";

const NotFound = () => {
  return (
    <>
      <Meta title="Not Found" />

      <section>
        <Heading level={1}>Not Found</Heading>

        <p>The page you're looking for doesn't exist!</p>
      </section>
    </>
  );
};

export default NotFound;
