<#ftl output_format='HTML'>
<#assign requestURI=request.requestURI[request.contextPath?length..]/>
<#assign modernBrowser = true/>
<#assign ua = request.getAttribute('userAgent')!/>
<#if ua?? && ua.name=='msie' && ua.majorVersion lt 9>
<#assign modernBrowser = false/>
</#if>
<#if modernBrowser>
<!DOCTYPE html>
<html>
<#else>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
</#if>
<#compress>
<head>
<title>${title?no_esc}</title>
<#if modernBrowser>
<meta charset="utf-8">
<#else>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</#if>
<#if request.contextPath!=''>
<meta name="context_path" content="${request.contextPath}" />
</#if>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="shortcut icon" href="<@url value="/assets/images/favicon.ico"/>" />
<link href="<@url value="/assets/styles/ironrhino${devMode?then('','-min')}.css"/>" media="all" rel="stylesheet" type="text/css" />
<script src="<@url value="/assets/scripts/ironrhino${devMode?then('','-min')}.js"/>" type="text/javascript"<#if modernBrowser&&!head?contains('</script>')> defer</#if>></script>
<#include "include/assets.ftl" ignore_missing=true/>
${head?no_esc}
</head>
<body class="simple ${.lang}">
<div id="content" class="simple">
<#if action.hasActionMessages() || action.hasActionErrors()>
<div id="message">
<@s.actionerror />
<@s.actionmessage />
</div>
</#if>
${body?no_esc}
</div>
</body>
</html></#compress>