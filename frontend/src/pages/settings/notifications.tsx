"use client"

import { useTranslation } from "../../lib/useTranslations"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import SettingsLayout from "../../components/settings_layout"

export default function Notifications() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    security: true,
  })

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t("notifications_title")}</h1>

        <Card className="bg-[#1a1a1a] border-[#1a1a1a]">
          <CardHeader>
            <CardTitle>{t("notification_preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t("email_notifications")}</h3>
                <p className="text-sm text-gray-400">{t("email_notifications_desc")}</p>
              </div>
              <Switch checked={notifications.email} onCheckedChange={() => handleToggle("email")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t("push_notifications")}</h3>
                <p className="text-sm text-gray-400">{t("push_notifications_desc")}</p>
              </div>
              <Switch checked={notifications.push} onCheckedChange={() => handleToggle("push")} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t("security_alerts")}</h3>
                <p className="text-sm text-gray-400">{t("security_alerts_desc")}</p>
              </div>
              <Switch checked={notifications.security} onCheckedChange={() => handleToggle("security")} />
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700">
              {t("save_preferences")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
