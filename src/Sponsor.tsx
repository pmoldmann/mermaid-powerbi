import { Button, Flex, Typography } from "antd";
import React from "react";

export interface SponsorProps {
    launchUrl: (url: string) => void;
}


export const Sponsor: React.FC<SponsorProps> = ({ launchUrl }) => {
    return (
        <div>
            <Typography.Title level={2}>Support AVEIRUN LLC</Typography.Title>
            <div className="section">
                <Typography.Paragraph>
                    Markdown & Mermaid Visual is a free and open-source tool designed to enhance data visualization within Power BI. It allows users to create rich markdown-based content and dynamic diagrams using Mermaid.js. The project is licensed under the <Typography.Link href="https://github.com/zBritva/mermaid-powerbi/blob/master/LICENSE">GNU General Public License v3.0</Typography.Link>.
                </Typography.Paragraph>
            </div>

            <div className="section">
                <Typography.Paragraph>
                    AVEIRUN LLC develops and maintains free-to-use Power BI visuals, including this Markdown & Mermaid Visual. Your support helps us continue to innovate and provide high-quality tools for the community.
                </Typography.Paragraph>
                <Typography.Paragraph>
                    If you find our visuals valuable, please consider supporting our work through one of the options below:
                </Typography.Paragraph>
            </div>

            <div className="section">
                <Typography.Title level={3}>How to Support Us</Typography.Title>
                <Flex gap="middle" wrap="wrap">
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => launchUrl("https://buy.stripe.com/00wbJ10AmdUIbQuewhgUM00")}
                    >
                        Donate via Stripe
                    </Button>
                    <Button
                        type="default"
                        size="large"
                        onClick={() => launchUrl("https://github.com/sponsors/aveirun")}
                    >
                        Sponsor on GitHub
                    </Button>
                </Flex>
                <Flex gap="middle" wrap="wrap" vertical>
                    <Typography.Title level={3}>Support & Community</Typography.Title>
                    <Typography.Paragraph>Your feedback and contributions help improve the project! You can:</Typography.Paragraph>
                    <ul>
                        <li><Typography.Link href="https://github.com/zBritva/mermaid-powerbi/discussions">Share ideas</Typography.Link></li>
                        <li><Typography.Link href="https://github.com/zBritva/mermaid-powerbi/issues">Report issues</Typography.Link></li>
                        <li><Typography.Link href="https://www.bibb.pro/">Share your experience</Typography.Link></li>
                    </ul>
                </Flex>

            </div>

            <div className="section">
                <Typography.Title level={3}>Why Your Support Matters</Typography.Title>
                <Typography.Paragraph>
                    Your contributions directly fund development efforts, allowing us to:
                </Typography.Paragraph>
                <ul>
                    <li><Typography.Text>Add new features and functionalities.</Typography.Text></li>
                    <li><Typography.Text>Maintain compatibility with the latest Power BI updates.</Typography.Text></li>
                    <li><Typography.Text>Provide ongoing support and bug fixes.</Typography.Text></li>
                </ul>
            </div>

            <div className="section">
                <Typography.Title level={3}>Source Code & Contributions</Typography.Title>
                <Typography.Paragraph>The complete source code is available on <strong>GitHub</strong>:</Typography.Paragraph>
                <Typography.Paragraph><a href="https://github.com/zBritva/mermaid-powerbi">GitHub Repository</a></Typography.Paragraph>
            </div>

            <div className="section">
                <Typography.Title level={3}>Technology & Dependencies</Typography.Title>
                <Typography.Paragraph>The visual is powered by several third-party libraries:</Typography.Paragraph>
                <ul>
                    <li><Typography.Link href="https://uiwjs.github.io/react-md-editor/">react-md-editor</Typography.Link> – Markdown rendering</li>
                    <li><Typography.Link href="https://mermaid.js.org/">mermaid-js</Typography.Link> – Diagram and flowchart visualization</li>
                    <li><Typography.Link href="https://handlebarsjs.com/">Handlebars.js</Typography.Link> – Handlebars is a simple templating language</li>
                    <li><Typography.Link href="https://d3js.org/">D3.js</Typography.Link> – The JavaScript library for bespoke data visualization</li>
                    <li><Typography.Link href="https://github.com/zBritva/mermaid-powerbi/blob/master/package.json#L13">Full list of dependencies</Typography.Link></li>
                </ul>
            </div>

            <div className="section">
                <Typography.Title level={3}>Changelog & Updates</Typography.Title>
                <Typography.Paragraph>Stay updated with new features and improvements:</Typography.Paragraph>
                <Typography.Paragraph><Typography.Link href="https://ilfat-galiev.im/docs/markdown-visual/changelog">Changelog</Typography.Link></Typography.Paragraph>
            </div>

        </div>
    );
}
