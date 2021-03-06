<#ftl output_format='HTML'>
<!DOCTYPE html>
<html>
<head>
<title>${getText('upload')}</title>
</head>
<body>
<@s.form id="upload_form" action="${actionBaseUrl}" method="post" enctype="multipart/form-data" class="form-inline">
	<div class="row<#if fluidLayout>-fluid</#if>">
	<#list 1..Parameters.size?default('4')?number as index>
		<div class="span3"><@s.file theme="simple" name="file" multiple="true"/></div>
	</#list>
	</div>
	<div style="text-align:center;padding-top:30px;">
	<@s.submit theme="simple" value="${getText('upload')}"/>
	<label for="autorename">${getText('autorename')}:</label><@s.checkbox theme="simple" id="autorename" name="autorename" class="custom"/>
	</div>
	<table id="files" class="checkboxgroup table table-striped middle" style="margin-top:50px;">
		<caption style="font-size:120%;font-weight:bold;"><@s.hidden id="folder" name="folder"/>${getText('current.location')}:<span id="current_folder" style="margin-left:10px;">${folder}<#if !folder?ends_with('/')>/</#if></span></caption>
		<thead>
		<tr style="font-weight:bold;height:43px;">
			<td style="width:30px" class="checkbox"><input type="checkbox" class="checkbox checkall custom"/></td>
			<td style="width:300px;"><span style="line-height:28px;">${getText('name')}</span><input type="search" class="filter input-small pull-right"/></td>
			<td style="width:150px" class="center;">${getText('preview')}</td>
			<td >${getText('path')}</td>
		</tr>
		</thead>
		<tfoot>
		<tr>
			<td colspan="4" class="center">
			<button type="button" class="btn delete">${getText('delete')}</button>
			<button type="button" class="btn mkdir">${getText('create.subfolder')}</button>
			<button type="button" class="btn snapshot">${getText('snapshot')}</button>
			<button type="button" class="btn reload">${getText('reload')}</button>
			</td>
		</tr>
		</tfoot>
		<tbody>
		<#list files as key,value>
		<tr>
			<td class="checkbox"><#if key!='..'><input type="checkbox" name="id" value="${key}" class="custom"/></#if></td>
			<td><#if value><span class="uploaditem filename" style="cursor:pointer;">${key}</span> <a href="<@url value="${action.getFileUrl(key?url)}"/>" target="_blank" download="${key}"><i class="glyphicon glyphicon-download-alt"></i></a><#else><a style="color:blue;" class="ajax view history" data-replacement="files" href="<#if key!='..'>${actionBaseUrl}/list${folderEncoded}/${key?url}<#else>${actionBaseUrl}/list${folderEncoded?keep_before_last('/')}</#if>">${key}</a></#if></td>
			<td><#if value && ['jpg','gif','png','bmp']?seq_contains(key?lower_case?split('.')?last)><a href="<@url value="${action.getFileUrl(key?url)}"/>" target="_blank"><img class="uploaditem" src="<@url value="${action.getFileUrl(key?url)}"/>" style="height:50px;"/></a></#if></td>
			<td><#if value><span style="word-break: break-all;"><@url value="${action.getFileUrl(key?url)}"/></span></#if></td>
		</tr>
		</#list>
		</tbody>
	</table>
</@s.form>
</body>
</html>


