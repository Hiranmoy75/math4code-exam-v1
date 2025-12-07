import React from 'react';
import Link from 'next/link';

export default function TermsOfUsePage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">Terms of Use</h1>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4">1. Access and Registration</h2>
                    <p>
                        If You’re an individual You must be at least 18 (eighteen) years of age, or, if You are between the ages of 13 and 18, You must have Your parent or legal guardian's permission to use the Platform. By using the Platform, You are, through Your actions, representing and warranting to us that You have obtained the appropriate consents/permissions to use the Platform. If You are under the age of 13 years or 16 years (depending on your country of residence), You may neither use our Platform in any manner nor may You register for any content or services offered therein.
                    </p>
                    <p>
                        To access any Content (as defined below) offered on the Platform, we require You to register for the same by providing Your name and email address. Please read our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> to understand how we handle Your information. Further, You may also be required to make payment of a fee to access the Content, if applicable.
                    </p>
                    <p>
                        You represent that the information indicated by You during Your enrolment or registration for any Content on the Platform, is true and complete, that You meet the eligibility requirements for use of the Platform and the Content offered therein, and You agree to update us upon any changes to the information by writing to us.
                    </p>
                    <p>
                        For the purpose of this Agreement, “Content” shall mean and include any course or session (whether pre-recorded or live) published by the Creator on the Platform, including, but not limited to any reference materials and text files (if any) offered to You as part of the Content.
                    </p>
                    <p>
                        When You register or enrol for any Content on the Platform, You may also have access to discussion forums that enables You to exchange Your thoughts, knowledge in relation to the Content or its subject-matter, with us and other registrants to the Content (“Public Forum”). Participating in the Public Forum is completely Your choice and by registering or enrolling to a Content on the Platform, You are not obligated to participate in such Public Forum.
                    </p>
                    <p>
                        We maintain and reserve the right to refuse access to the Platform or remove content posted by You in the Public Forums, at any time without notice to You, if, in our opinion, You have violated any provision of this Agreement.
                    </p>
                    <p>
                        Further, to access the Platform and/or view the content on the Platform, You will need to use a “Supported/Compatible Device” which means a personal computer, mobile phone, portable media player, or other electronic device that meets the system and compatibility requirements and on which You are authorized to operate the Platform.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">2. License to Use</h2>
                    <p>
                        You are granted a limited, non-exclusive license to access and view the Content on the Platform for Your own personal, non-commercial use only. Further, if so allowed on the Platform, You may temporarily download one copy of any downloadable Content [including Creator Content] on the Platform for personal and non-commercial transitory viewing only.
                    </p>
                    <p>
                        This license does not grant You the right to assign or sublicense the license granted under this Agreement to anyone else. Further, You may not:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li>modify, edit or copy the Content, Creator Content or any material made available on the Platform;</li>
                        <li>create derivative works or exploit any material made available on the Platform (including the Content and Creator Content) or any portion thereof;</li>
                        <li>publicly display (commercially or non-commercially) the Content, Creator Content or any material made available on the Platform or otherwise use the same for any commercial purpose;</li>
                        <li>attempt to decompile or reverse engineer any software contained in the Platform;</li>
                        <li>remove any copyright or other proprietary notations from the Content, Creator Content or any material made available on the Platform; or</li>
                        <li>transfer any material made available on the Platform to another person or 'mirror' the same on any other server.</li>
                    </ul>
                    <p className="mt-4">
                        This license shall automatically terminate if You violate any of these restrictions and may be terminated by us at any time. Upon termination of this license granted to You or Your viewing of any material on the Platform, You must destroy any downloaded materials in Your possession (whether in electronic or printed format).
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">3. Communications</h2>
                    <p>
                        The Platform includes provision and facilitation of Public Forums designed to enable You to communicate with us and other registrants to the Content You have registered for. As stated above, use of these Public Forums are completely your choice and by registering for a Content, you are not obligated to participate in the Public Forum. However, if You choose to participate, You agree to adhere to the terms specified in the ‘Code of Conduct’ section hereinbelow and such other terms as may be published on our Platform.
                    </p>
                    <p>
                        You represent and warrant that You own and control all rights in and to any content (including without limitation chats, postings, or materials) uploaded or posted by You on the Public Forums or anywhere on the Platform (“Learner Content”), or that You are licensed to use and reproduce such Learner Content. We are not responsible for the information that You choose to share on the Public Forums, or for the actions of other users therein.
                    </p>
                    <p>
                        Further, if you do post content or submit any Learner Content on the Platform, and unless otherwise indicated by You in writing (emails included) to us, You hereby grant us a non-exclusive, royalty-free, irrevocable, perpetual and fully sublicensable rights to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such Learner Content throughout the world in any media.
                    </p>
                </section>
            </div>
        </div>
    );
}
