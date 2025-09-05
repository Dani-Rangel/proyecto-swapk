"use client"

import { useTranslation } from "../../lib/useTranslations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare } from "lucide-react"
import { useTheme } from "../../components/state/theme_context"
import SettingsLayout from "../../components/settings_layout"

export default function HelpCenter() {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const cardBg = theme === "dark" ? "bg-[#1a1a1a]" : "bg-gray-50"
  const borderColor = theme === "dark" ? "border-gray-700" : "border-gray-200"

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("help_center_title")}</h1>
          <Button className="bg-green-600 hover:bg-green-700">
            {t("save_changes")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`${cardBg} border ${borderColor}`}>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">{t("user_manual")}</h3>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-4`}>
                {t("user_manual_desc")}
              </p>
              <Button variant="outline" className="w-full bg-transparent">
                {t("download")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className={`${cardBg} border ${borderColor}`}>
          <CardHeader>
            <CardTitle>{t("contact_support")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">{t("subject")}</Label>
              <Input
                id="subject"
                placeholder={t("subject_placeholder")}
                className={`${theme === "dark" ? "bg-[#2a2a2a] border-gray-600" : "bg-white border-gray-300"}`}
              />
            </div>
            <div>
              <Label htmlFor="message">{t("message")}</Label>
              <Textarea
                id="message"
                placeholder={t("message_placeholder")}
                className={`${theme === "dark" ? "bg-[#2a2a2a] border-gray-600" : "bg-white border-gray-300"} min-h-[120px]`}
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">{t("send_message")}</Button>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}
