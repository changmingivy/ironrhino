<#ftl output_format='HTML'>
<!DOCTYPE html>
<html>
<head>
<title>${getText('change')}${getText('password')}</title>
</head>
<body>
<#if !(authentication("principal").credentialsNonExpired!true)>
<div class="action-error alert alert-error">
<a class="close" data-dismiss="alert">&times;</a>
${getText('org.springframework.security.authentication.CredentialsExpiredException')}
</div>
</#if>
<@s.form action="${actionBaseUrl}/password" method="post" class="form-horizontal ajax focus reset">
	<#if userCurrentPasswordNeeded>
	<@s.password name="currentPassword" class="required input-pattern sha" readonly=userProfileReadonly/>
	</#if>
	<@s.password name="password" class="required input-pattern sha" readonly=userProfileReadonly/>
	<@s.password name="confirmPassword" class="required repeat input-pattern submit sha" data\-repeatwith="password" readonly=userProfileReadonly/>
	<@s.submit value=getText('save') class="btn-primary" disabled=userProfileReadonly/>
</@s.form>
</body>
</html>