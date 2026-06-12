import { Trash2 } from "lucide-react";
import Button from "@/components/Button";
import { H1, H2 } from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";

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

      <section className="width-md">
        <H2>Licenses</H2>

        <ul>
          <li>
            The Meta2Onto web server codebase holds the BSD 3-Clause software
            license.
          </li>
          <li>
            All predicted annotations stored and distributed by Meta2Onto are
            licensed under CC BY 4.0.
          </li>
          <li>
            The text models and codebase used to predict the annotations stored
            and distributed by Meta2Onto are licensed under the BSD 3-Clause
            software license.
          </li>
        </ul>
      </section>

      <section className="width-md">
        <H2>Privacy Policy</H2>

        <ol>
          <li>
            Feedback & Anonymity
            <ol>
              <li>
                All feedback submitted through this application is collected
                anonymously by default. No personally identifying information is
                associated with your feedback unless you explicitly choose to
                opt in to identified feedback.
              </li>
            </ol>
          </li>
          <li>
            Use of Feedback Data
            <ol>
              <li>
                Any feedback collected through this application is used solely
                for internal purposes, including research, quality improvement,
                and software development. We do not sell, license, share, or
                otherwise distribute feedback data to any third parties outside
                of the KrishnanLab and our authorized software development team.
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
                . By using this application, you acknowledge and consent to this
                form of analytics tracking.
              </li>
            </ol>
          </li>
          <li>
            Locally Stored Data
            <ol>
              <li>
                This application stores data in your browser to track feedback
                submissions and search metrics, which are used to display
                relevant information back to you during your session. These data
                are used exclusively for your personal experience within the
                application and are never shared. They are not shared with the
                KrishnanLab beyond what is necessary for the application to
                function, nor with any outside parties.
              </li>
              <li>
                You may clear this local data at any time using the button
                below; however, doing so may affect certain features of the
                application.
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
