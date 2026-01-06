import React, { JSX, useEffect, useState } from 'react'
import { ButtonItem, Field, PanelSection, PanelSectionRow } from '@decky/ui'
import Trans from '@/lib/i18n'
import PanelContainer from '@/components/PanelContainer'

interface DisclaimerProps {
  onAgree: () => void
}

const styles: React.CSSProperties = {
  fontSize: '14px',
}

const Disclaimer = (props: DisclaimerProps): JSX.Element => {
  const [countdown, setCountdown] = useState<number>(5)
  const [canAgree, setCanAgree] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      setCanAgree(true)
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  return (
    <PanelContainer>
      <PanelSection title={Trans('TERMS_OF_USE_DISCLAIMER', 'Terms of Use & Disclaimer')}>
        <PanelSectionRow>
          <Field childrenLayout="below" focusable>
            <div
              style={styles}
              dangerouslySetInnerHTML={{
                __html: Trans(
                  'DISCLAIMER_REROLL',
                  '<b>Reroll</b> is a general-purpose memory research tool. It is developed independently and does not contain any proprietary assets, copyrighted source code, or bypass mechanisms belonging to third-party game developers or publishers.'
                ),
              }}
            />
          </Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field childrenLayout="below" focusable>
            <div
              style={styles}
              dangerouslySetInnerHTML={{
                __html: Trans(
                  'DISCLAIMER_ROOT',
                  '<b>Root Access</b>: This plugin requires <b>Root privileges</b> for memory R/W operations. By proceeding, you grant the software full access to system process memory.'
                ),
              }}
            />
          </Field>
        </PanelSectionRow>

        <PanelSectionRow>
          <Field childrenLayout="below" focusable>
            <div
              style={styles}
              dangerouslySetInnerHTML={{
                __html: Trans(
                  'DISCLAIMER_AS_IS',
                  '<b>"AS IS" Basis</b>: This software is provided <b>"AS IS"</b> without warranty. The developer is not responsible for any system instability, data loss, or account-related issues.'
                ),
              }}
            />
          </Field>
        </PanelSectionRow>

        <PanelSectionRow>
          <Field childrenLayout="below" focusable>
            <div
              style={styles}
              dangerouslySetInnerHTML={{
                __html: Trans(
                  'DISCLAIMER_OFFLINE',
                  '<b>Offline Use Only</b>: This tool is strictly for <b>Single-Player/Offline</b> environments. Use in online/multiplayer games is <b>STRICTLY PROHIBITED</b>.'
                ),
              }}
            />
          </Field>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem onClick={props.onAgree} disabled={!canAgree} layout="below">
            {canAgree ? Trans('AGREE', 'Agree') : `${Trans('AGREE', 'Agree')} (${countdown}s)`}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </PanelContainer>
  )
}

export default Disclaimer
