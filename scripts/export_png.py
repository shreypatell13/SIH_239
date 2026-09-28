import win32com.client, os, time

ppt_path = os.path.abspath('C:/Users/shrey_9lumr8o/OneDrive/Desktop/SIH_239/SIH2026-IDEA-Presentation-Format_V2.pptx')
out_png = os.path.abspath('C:/Users/shrey_9lumr8o/.gemini/antigravity/brain/fbcef263-5d74-4917-8ebe-a4ca31f87d1b/slide2_render.png')

powerpoint = win32com.client.Dispatch('PowerPoint.Application')
pres = powerpoint.Presentations.Open(ppt_path, ReadOnly=True, Untitled=False, WithWindow=False)
pres.Slides(2).Export(out_png, 'PNG', 1920, 1080)
pres.Close()
print('Successfully exported updated slide 2 image to:', out_png)
