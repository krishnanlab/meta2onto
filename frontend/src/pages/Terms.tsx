import { Trash2 } from "lucide-react";
import Button from "@/components/Button";
import { H1, H2 } from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";

const { VITE_REPO: repo } = import.meta.env;

const clearWarning = `
Clear all ${import.meta.env.VITE_TITLE} info saved on this device? No undo.

(Does not affect info already sent to us, such as previously submitted feedback.)
`;

export default function Terms() {
  return (
    <>
      <Meta title="Terms and Conditions" />

      <section className="bg-theme-light">
        <H1>Terms and Conditions</H1>
      </section>

      <section>
        <H2>Licenses</H2>

        <ul>
          <li>
            The Meta2Onto <Link to={repo}>web app codebase</Link> are licensed
            under BSD 3-Clause software.
          </li>
          <li>
            All predicted annotations stored and distributed by Meta2Onto are
            licensed under CC BY 4.0.
          </li>
          <li>
            The text models and codebase used to predict the annotations stored
            and distributed by Meta2Onto are licensed under BSD 3-Clause
            software.
          </li>
        </ul>

        <p>
          You may use the predicted annotations from Meta2Onto in commercial and
          non-commercial applications with proper attribution.
        </p>
      </section>

      <section>
        <H2>Privacy Policy</H2>

        <ol>
          <li>
            Feedback & Anonymity
            <ol>
              <li>
                All feedback submitted through this web application is collected
                anonymously by default. No personally identifying information is
                associated with your feedback unless you explicitly choose to
                provide it.
              </li>
            </ol>
          </li>
          <li>
            Use of feedback Data
            <ol>
              <li>
                Any feedback collected through this web application is used
                solely for internal purposes of research, quality improvement,
                and software development. We do not sell, license, share, or
                otherwise distribute feedback data to any parties outside of the
                KrishnanLab and our authorized software development team.
              </li>
              <li>
                We will never disclose private or personally identifying
                information. Access to feedback data is strictly limited to
                personnel who require it for legitimate development and research
                purposes.
              </li>
            </ol>
          </li>
          <li>
            Analytics & User Behavior Tracking
            <ol>
              <li>
                This web application may collect data about user behavior and
                site usage through Google Analytics. This service helps us
                understand how users interact with the application in order to
                improve functionality and user experience. Google Analytics data
                is subject to{" "}
                <Link to="https://policies.google.com/privacy">
                  Google's Privacy Policy
                </Link>
                . By using this web application, you acknowledge and consent to
                this form of analytics tracking.
              </li>
            </ol>
          </li>
          <li>
            Locally Stored Data
            <ol>
              <li>
                This web application stores a small amount of data in your
                browser to remember feedback, searches, and other metrics you've
                done from your specific device. These data are used exclusively
                to enhance your experience within the web application and are
                never shared. You may clear this local data at any time using
                the button below.
              </li>
            </ol>
          </li>
          <li>
            Contact
            <ol>
              <li>
                If you have questions or concerns about this privacy policy or
                how your data is handled, please{" "}
                <Link to="about#contact">contact us</Link>.
              </li>
            </ol>
          </li>
        </ol>

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
    </>
  );
}
