import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { FileTreeDemo } from "../components/FileTreeDemo";

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${siteConfig.title} - Documentation Portal`}
      description="Centralized documentation for the Rathburn Ops monorepo"
    >
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1 className="text--center margin-bottom--lg">
              Rathburn Documentation Portal
            </h1>
            <p className="text--center margin-bottom--lg">
              Browse all documentation for the Rathburn Ops monorepo in one
              centralized location. Use the file tree below to navigate through
              the documentation structure.
            </p>

            <div className="margin-bottom--lg">
              <FileTreeDemo />
            </div>

            <div className="margin-top--xl">
              <h2>Project Documentation</h2>
              <p>
                The documentation is organized into the following categories:
              </p>
              <ul>
                <li>
                  <strong>User Guides</strong> - Documentation for end users of
                  the application
                </li>
                <li>
                  <strong>Development</strong> - Documentation for developers
                  working on the project
                </li>
                <li>
                  <strong>Architecture</strong> - Documentation on the system
                  architecture and design
                </li>
                <li>
                  <strong>Deployment</strong> - Documentation on deployment and
                  hosting configurations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
